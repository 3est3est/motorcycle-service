import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const userRole = user.user_metadata?.role || "customer";
    const isStaff = userRole === "admin" || userRole === "staff";

    if (isStaff) {
      const [pendingBookings, activeRepairs, lowStockParts, totalRevenue] =
        await Promise.all([
          prisma.booking.count({ where: { status: "pending" } }),
          prisma.repairJob.count({ where: { status: "in_progress" } }),
          prisma.part.count({ where: { stock_qty: { lt: 5 } } }),
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: { status: "success" },
          }),
        ]);

      const latestBookings = await prisma.booking.findMany({
        orderBy: { booking_time: "asc" },
        take: 5,
        include: { customer: true, motorcycle: true },
        where: { status: "pending" },
      });

      return NextResponse.json({
        stats: {
          confirmedBookings: pendingBookings,
          activeRepairs: activeRepairs,
          inventory: lowStockParts,
          loyaltyPoints: totalRevenue._sum.amount
            ? Number(totalRevenue._sum.amount)
            : 0,
          pendingPayments: 0,
        },
        listData: latestBookings,
        customerName: user.user_metadata?.full_name || "Staff",
      });
    } else {
      const customer = await prisma.customer.findUnique({
        where: { user_id: user.id },
        include: {
          loyalty_points: true,
          bookings: {
            orderBy: { booking_time: "desc" },
            take: 5,
            include: { motorcycle: true },
          },
        },
      });

      if (!customer)
        return NextResponse.json(
          { message: "Customer not found" },
          { status: 404 },
        );

      const pendingPaymentsCount = await prisma.payment.count({
        where: {
          repair_job: { booking: { customer_id: customer.id } },
          status: "pending",
        },
      });

      const activeRepairsList = await prisma.repairJob.findMany({
        where: {
          booking: { customer_id: customer.id },
          status: { in: ["created", "in_progress", "completed"] },
        },
        include: { booking: { include: { motorcycle: true } } },
      });

      const stats = {
        confirmedBookings: customer.bookings.filter(
          (b) => b.status === "confirmed",
        ).length,
        activeRepairs: activeRepairsList.length,
        inventory: 0,
        loyaltyPoints: customer.loyalty_points?.total_points ?? 0,
        pendingPayments: pendingPaymentsCount,
      };

      // Enrich bookings with repair info
      const enrichedBookings = customer.bookings.map((b) => {
        const rj = activeRepairsList.find((r) => r.booking_id === b.id);
        return { ...b, repair: rj };
      });

      return NextResponse.json({
        stats,
        listData: enrichedBookings,
        activeRepairs: activeRepairsList,
        customerName: customer.full_name,
      });
    }
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const userRole = user.user_metadata?.role || "customer";
    const isStaff = userRole === "admin" || userRole === "staff";

    if (isStaff) {
      const [pendingBookings, activeRepairs, lowStockParts, totalRevenue, customerConfirmed] = await Promise.all([
        prisma.booking.count({ where: { status: "pending" } }),
        prisma.repairJob.count({ where: { status: "in_progress" } }),
        prisma.part.findMany({ select: { stock_qty: true, min_stock: true } }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: "success" },
        }),
        // Count repairs where customer just confirmed = ready to start
        prisma.repairJob.count({
          where: { status: "created", customer_confirmed: true },
        }),
      ]);

      const lowStockCount = (lowStockParts as any).filter((p: any) => p.stock_qty < (p.min_stock || 5)).length;

      const latestBookings = await prisma.booking.findMany({
        orderBy: { booking_time: "asc" },
        take: 5,
        include: { customer: true, motorcycle: true },
        where: { status: "pending" },
      });

      // Weekly Revenue Data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        return d;
      }).reverse();

      const revenueChart = await Promise.all(
        last7Days.map(async (date) => {
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);

          const daySum = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
              status: "success",
              created_at: {
                gte: date,
                lt: nextDay,
              },
            },
          });

          return {
            date: date.toLocaleDateString("th-TH", { weekday: "short" }),
            amount: Number(daySum._sum.amount || 0),
          };
        }),
      );

      return NextResponse.json({
        stats: {
          confirmedBookings: pendingBookings,
          activeRepairs: activeRepairs,
          inventory: lowStockCount,
          totalRevenue: totalRevenue._sum.amount ? Number(totalRevenue._sum.amount) : 0,
          pendingPayments: 0,
          customerConfirmedRepairs: customerConfirmed,
        },
        listData: latestBookings,
        revenueChart,
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

      if (!customer) {
        return NextResponse.json({
          stats: {
            confirmedBookings: 0,
            activeRepairs: 0,
            inventory: 0,
            loyaltyPoints: 0,
            pendingPayments: 0,
            pendingEstimates: 0,
            pendingQuotations: 0,
          },
          listData: [],
          activeRepairs: [],
          customerName: user.user_metadata?.full_name || "New Customer",
        });
      }

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
        include: {
          booking: {
            include: {
              motorcycle: true,
              estimate: true,
            },
          },
        },
      });

      // Count pending estimates (waiting for customer to confirm)
      const pendingEstimatesCount = await (prisma.estimate as any).count({
        where: {
          booking: { customer_id: customer.id },
          status: "pending",
        },
      });

      // Count pending quotations
      const pendingQuotationsCount = await prisma.quotation.count({
        where: {
          booking: { customer_id: customer.id },
          status: "pending_customer_approval",
        },
      });

      const stats = {
        confirmedBookings: customer.bookings.filter((b) => b.status === "confirmed").length,
        activeRepairs: activeRepairsList.length,
        inventory: 0,
        loyaltyPoints: customer.loyalty_points?.total_points ?? 0,
        pendingPayments: pendingPaymentsCount,
        pendingEstimates: pendingEstimatesCount,
        pendingQuotations: pendingQuotationsCount,
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
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

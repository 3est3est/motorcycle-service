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
    if (!user) return NextResponse.json({ message: "Unauthorized", errorCode: "UNAUTHORIZED" }, { status: 401 });

    const role = user.user_metadata?.role;
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ message: "Forbidden", errorCode: "FORBIDDEN" }, { status: 403 });
    }

    // 1. Stock Data
    const parts = await prisma.part.findMany({
      orderBy: { name: "asc" },
    });

    const lowStockCount = parts.filter((p) => p.stock_qty <= p.min_stock).length;
    const totalValue = parts.reduce((sum, p) => sum + Number(p.price) * p.stock_qty, 0);

    const stockReports = {
      data: parts,
      stats: {
        totalItems: parts.length,
        lowStockCount,
        totalValue,
      },
    };

    // 2. Revenue Data (Current Month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const payments = await prisma.payment.findMany({
      where: {
        status: "success",
      },
      include: {
        repair_job: {
          include: {
            booking: {
              include: {
                motorcycle: true,
                customer: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    const revenueReports = {
      data: payments,
      stats: {
        totalCount: payments.length,
        totalRevenue,
      },
    };

    // 3. Revenue Trends (Monthly for the last 6 months)
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthSum = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "success",
          paid_at: { gte: start, lte: end },
        },
      });

      trends.push({
        label: start.toLocaleDateString("th-TH", { month: "short", year: "2-digit" }),
        amount: Number(monthSum._sum.amount || 0),
      });
    }

    return NextResponse.json({
      stockReports,
      revenueReports,
      trends,
    });
  } catch (error) {
    console.error("Reports API Error:", error);
    return NextResponse.json({ message: "Internal Server Error", errorCode: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

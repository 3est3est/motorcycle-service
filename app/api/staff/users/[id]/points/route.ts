import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// PATCH /api/staff/users/[id]/points - Adjust customer points (Admin/Staff)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    // ONLY Staff/Admin can adjust points
    if (!authUser || (authUser.user_metadata?.role !== "staff" && authUser.user_metadata?.role !== "admin")) {
      return NextResponse.json({ message: "Forbidden: Staff access required" }, { status: 403 });
    }

    const { amount, type, reason } = await request.json(); // amount is absolute change, type is "earn" | "redeem" | "adjust"

    if (amount === undefined || amount === null || !type) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { user_id: userId },
      include: { loyalty_points: true },
    });

    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert LoyaltyPoints record
      const loyaltyPoints = await tx.loyaltyPoints.upsert({
        where: { customer_id: customer.id },
        create: {
          customer_id: customer.id,
          total_points: type === "redeem" ? -amount : amount,
        },
        update: {
          total_points: {
            [type === "redeem" ? "decrement" : "increment"]: amount,
          },
        },
      });

      // 2. Log Transaction
      const transaction = await tx.pointTransaction.create({
        data: {
          loyalty_points_id: loyaltyPoints.id,
          event_type: type,
          points: amount,
        },
      });

      return { loyaltyPoints, transaction };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Point Adjustment Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

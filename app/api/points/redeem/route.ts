import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// POST /api/points/redeem - Redeem points for a reward
export async function POST(request: Request) {
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
          setAll() {},
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { points_to_redeem, description } = await request.json();

    if (!points_to_redeem || points_to_redeem <= 0) {
      return NextResponse.json({ message: "Invalid points" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
      include: { loyalty_points: true },
    });

    if (!customer || !customer.loyalty_points) {
      return NextResponse.json(
        { message: "Loyalty account not found" },
        { status: 404 },
      );
    }

    if (customer.loyalty_points.total_points < points_to_redeem) {
      return NextResponse.json(
        { message: "คะแนนสะสมไม่เพียงพอ" },
        { status: 400 },
      );
    }

    // Process Redemption in Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct Points
      const updatedLoyalty = await tx.loyaltyPoints.update({
        where: { id: customer.loyalty_points?.id },
        data: {
          total_points: { decrement: points_to_redeem },
        },
      });

      // 2. Create Transaction Log
      const transaction = await tx.pointTransaction.create({
        data: {
          loyalty_points_id: updatedLoyalty.id,
          event_type: "redeem",
          points: points_to_redeem,
        },
      });

      return { updatedLoyalty, transaction };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Redeem Points Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
          setAll() {},
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
      include: {
        loyalty_points: {
          include: {
            point_transactions: {
              orderBy: { created_at: "desc" },
            },
          },
        },
      },
    });

    if (!customer)
      return NextResponse.json(
        { message: "Customer profile not found" },
        { status: 404 },
      );

    return NextResponse.json({
      total_points: customer.loyalty_points?.total_points || 0,
      transactions: customer.loyalty_points?.point_transactions || [],
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

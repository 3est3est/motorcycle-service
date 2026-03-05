import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/estimates - ลูกค้าดูใบประเมินราคาของตัวเอง (FR-14, FR-15)
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

    const role = user.user_metadata?.role;

    // Staff/Admin see all estimates
    if (role === "staff" || role === "admin") {
      const estimates = await prisma.estimate.findMany({
        include: {
          booking: {
            include: {
              customer: true,
              motorcycle: true,
              repair_job: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });
      return NextResponse.json(estimates);
    }

    // Customer sees only their own estimates
    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });

    if (!customer)
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 },
      );

    const estimates = await prisma.estimate.findMany({
      where: {
        booking: { customer_id: customer.id },
      },
      include: {
        booking: {
          include: {
            motorcycle: true,
            repair_job: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(estimates);
  } catch (error) {
    console.error("Estimates GET error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

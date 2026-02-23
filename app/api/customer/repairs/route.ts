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

    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });
    if (!customer)
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 },
      );

    const repairs = await prisma.repairJob.findMany({
      where: {
        booking: { customer_id: customer.id },
      },
      include: {
        booking: {
          include: {
            motorcycle: true,
            estimate: true,
          },
        },
        repair_parts: {
          include: { part: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(repairs);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

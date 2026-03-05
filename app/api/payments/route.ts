import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/payments - Get user's payments
export async function GET() {
  try {
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
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const role = user.user_metadata?.role;

    // Staff/Admin see all payments
    if (role === "staff" || role === "admin") {
      const payments = await prisma.payment.findMany({
        include: {
          repair_job: {
            include: {
              booking: {
                include: {
                  customer: true,
                  motorcycle: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
      });
      return NextResponse.json(payments);
    }

    // Customer profile fetch
    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });

    if (!customer) return NextResponse.json({ message: "Customer profile not found" }, { status: 404 });

    const payments = await prisma.payment.findMany({
      where: {
        repair_job: {
          booking: { customer_id: customer.id },
        },
      },
      include: {
        repair_job: {
          include: {
            booking: {
              include: {
                motorcycle: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

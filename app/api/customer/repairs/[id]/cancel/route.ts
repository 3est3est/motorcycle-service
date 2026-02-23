import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get Repair Job
    const repair = await prisma.repairJob.findUnique({
      where: { id },
      include: {
        booking: true,
      },
    });

    if (!repair) {
      return NextResponse.json({ message: "Not Found" }, { status: 404 });
    }

    // Verify owner
    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });

    if (!customer || repair.booking.customer_id !== customer.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Logic: Only cancel if not started (status = created)
    if (repair.status !== "created") {
      return NextResponse.json(
        {
          message:
            "Cannot cancel a repair that is already in progress or completed.",
        },
        { status: 400 },
      );
    }

    // Update both using transaction
    const [updated] = await prisma.$transaction([
      prisma.repairJob.update({
        where: { id },
        data: {
          status: "cancelled",
          note: `Cancelled by customer at ${new Date().toLocaleString("th-TH")}`,
        },
      }),
      prisma.booking.update({
        where: { id: repair.booking_id },
        data: { status: "cancelled" },
      }),
    ]);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Customer Repair Cancellation Error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// PATCH /api/payments/[id]/slip — Customer uploads slip URL (FR-28)
// The client converts the image to base64 data URL or uploads to Supabase Storage
// and passes back the public URL. We store it in payment.slip_url.
export async function PATCH(
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
          setAll() {},
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { slip_url } = await request.json();
    if (!slip_url) {
      return NextResponse.json(
        { message: "slip_url is required" },
        { status: 400 },
      );
    }

    // Verify the payment belongs to this customer
    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });
    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 },
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        repair_job: {
          include: { booking: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { message: "Payment not found" },
        { status: 404 },
      );
    }

    // Customers can only upload slip for their own payments
    const isOwner = payment.repair_job.booking.customer_id === customer.id;
    // Staff/Admin can also update slip
    const isStaff =
      user.user_metadata?.role === "staff" ||
      user.user_metadata?.role === "admin";
    if (!isOwner && !isStaff) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (payment.status === "success") {
      return NextResponse.json(
        { message: "Payment already completed" },
        { status: 400 },
      );
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: { slip_url },
    });

    return NextResponse.json({ success: true, payment: updated });
  } catch (error) {
    console.error("Slip upload error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

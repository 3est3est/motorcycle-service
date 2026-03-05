import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/estimates/[id] - ลูกค้า confirm/reject ใบประเมิน (FR-18)
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

    const { action } = await request.json(); // "confirm" | "reject"
    if (!["confirm", "reject"].includes(action)) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    // Verify the estimate belongs to this customer
    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            customer: true,
            repair_job: true,
          },
        },
      },
    });

    if (!estimate)
      return NextResponse.json(
        { message: "Estimate not found" },
        { status: 404 },
      );

    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });

    // Only the customer who owns this booking, or staff/admin can act
    const role = user.user_metadata?.role;
    const isOwner = estimate.booking.customer_id === customer?.id;
    const isStaffOrAdmin = role === "staff" || role === "admin";

    if (!isOwner && !isStaffOrAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (action === "confirm") {
      // Mark customer_confirmed on the repair job (BR-RULE-02)
      if (estimate.booking.repair_job) {
        await prisma.repairJob.update({
          where: { id: estimate.booking.repair_job.id },
          data: { customer_confirmed: true },
        });
      }

      const updated = await (prisma.estimate as any).update({
        where: { id },
        data: { status: "approved" },
      });

      return NextResponse.json({ success: true, estimate: updated });
    } else {
      // Reject: update estimate status
      const updated = await (prisma.estimate as any).update({
        where: { id },
        data: { status: "rejected" },
      });

      return NextResponse.json({ success: true, estimate: updated });
    }
  } catch (error) {
    console.error("Estimate PATCH error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

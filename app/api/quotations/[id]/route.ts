import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/quotations/[id] - ลูกค้า approve/reject ใบเสนอราคา (FR-18, BR-RULE-02)
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

    const { action } = await request.json(); // "approve" | "reject"
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            customer: true,
            repair_job: true,
          },
        },
        items: {
          include: { part: true },
        },
      },
    });

    if (!quotation)
      return NextResponse.json(
        { message: "Quotation not found" },
        { status: 404 },
      );

    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });

    const role = user.user_metadata?.role;
    const isOwner = quotation.booking.customer_id === customer?.id;
    const isStaffOrAdmin = role === "staff" || role === "admin";

    if (!isOwner && !isStaffOrAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (action === "approve") {
      // BR-RULE-02: Customer approves → set customer_confirmed on repair job
      const result = await prisma.$transaction(async (tx) => {
        // Update quotation status
        const updatedQuotation = await tx.quotation.update({
          where: { id },
          data: { status: "approved" },
        });

        // Mark repair job as customer confirmed (unlock "start repair" button)
        if (quotation.booking.repair_job) {
          await tx.repairJob.update({
            where: { id: quotation.booking.repair_job.id },
            data: {
              customer_confirmed: true,
              quotation_id: id,
            },
          });
        }

        return updatedQuotation;
      });

      return NextResponse.json({ success: true, quotation: result });
    } else {
      // Reject: mark quotation as rejected
      const updated = await prisma.quotation.update({
        where: { id },
        data: { status: "rejected" },
      });

      return NextResponse.json({ success: true, quotation: updated });
    }
  } catch (error) {
    console.error("Quotation PATCH error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// GET /api/quotations/[id] - ดูใบเสนอราคาเดี่ยว (รองรับทั้ง ID ใบเสนอราคา และ ID การจอง)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const quotation = await prisma.quotation.findFirst({
      where: {
        OR: [{ id }, { booking_id: id }],
      },
      include: {
        items: {
          include: { part: true },
        },
        booking: {
          include: {
            customer: true,
            motorcycle: true,
          },
        },
      },
    });

    if (!quotation)
      return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json(quotation);
  } catch (error) {
    console.error("Quotation GET ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

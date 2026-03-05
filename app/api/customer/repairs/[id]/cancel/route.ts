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
          setAll() {},
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get Repair Job + all its parts
    const repair = await prisma.repairJob.findUnique({
      where: { id },
      include: {
        booking: true,
        repair_parts: true, // Need this to restore stock
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

    // Only cancel if not started
    if (repair.status !== "created") {
      return NextResponse.json(
        {
          message:
            "Cannot cancel a repair that is already in progress or completed.",
        },
        { status: 400 },
      );
    }

    // Run everything in a transaction:
    // 1. Restore stock for any parts that were added
    // 2. Log inventory changes
    // 3. Delete all repair_parts records
    // 4. Cancel the repair job & booking
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cancel repair job
      const updated = await tx.repairJob.update({
        where: { id },
        data: {
          status: "cancelled",
          note: `Cancelled by customer at ${new Date().toLocaleString("th-TH")}`,
        },
      });

      // 2. Cancel booking
      await tx.booking.update({
        where: { id: repair.booking_id },
        data: { status: "cancelled" },
      });

      // 3. Restore stock and Log
      for (const rp of repair.repair_parts) {
        const p = await tx.part.update({
          where: { id: rp.part_id },
          data: { stock_qty: { increment: rp.quantity } },
        });

        await tx.partInventoryLog.create({
          data: {
            part_id: rp.part_id,
            repair_job_id: id,
            change_qty: rp.quantity,
            balance_after: p.stock_qty,
            type: "REPAIR_RETURN",
            note: `ลูกค้ายกเลิกงานซ่อม ID: ${id.slice(-6).toUpperCase()}`,
          },
        });
      }

      // 4. Delete repair parts
      await tx.repairPart.deleteMany({ where: { repair_job_id: id } });

      return updated;
    });

    return NextResponse.json(result);
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

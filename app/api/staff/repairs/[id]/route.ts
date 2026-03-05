import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status, progress, labor_cost, note, assigned_staff_id } = await request.json();

    // 1. Update Repair Job
    const updateData: any = {
      status,
      progress: progress !== undefined ? progress : undefined,
      labor_cost: labor_cost !== undefined ? labor_cost : undefined,
      note: note !== undefined ? note : undefined,
      assigned_staff_id: assigned_staff_id !== undefined ? assigned_staff_id : undefined,
    };

    if (status === "in_progress") {
      updateData.start_date = new Date();
    } else if (status === "completed" || status === "delivered") {
      updateData.end_date = new Date();
    }

    const repair = await prisma.repairJob.update({
      where: { id },
      data: updateData,
      include: {
        booking: {
          include: { customer: true },
        },
        repair_parts: {
          include: { part: true },
        },
      },
    });

    // 2. Create Notification for Customer on status change
    if (status) {
      const statusLabels: Record<string, string> = {
        in_progress: "กำลังดำเนินการซ่อม",
        completed: "ซ่อมเสร็จเรียบร้อยแล้ว",
        delivered: "ส่งมอบรถคืนแล้ว",
      };

      await prisma.notification.create({
        data: {
          user_id: repair.booking.customer.user_id,
          title: "อัปเดตสถานะงานซ่อม",
          message: `รถของคุณ (${repair.booking.motorcycle_id.slice(-6).toUpperCase()}) ${statusLabels[status] || status}`,
          type: "REPAIR_STATUS",
        },
      });
    }

    // 2. If completed or delivered -> Handle Quotation & Payment
    if (status === "completed" || status === "delivered") {
      // Calculate total from parts + labor
      let totalParts = 0;
      repair.repair_parts.forEach((p) => {
        totalParts += Number(p.price_total);
      });
      const totalAmount = totalParts + Number(repair.labor_cost);

      // Create or Update Quotation
      const quotation = await prisma.quotation.upsert({
        where: { booking_id: repair.booking_id },
        update: {
          total_amount: totalAmount,
          status: "approved", // Auto-approve if finalized by staff for now
        },
        create: {
          booking_id: repair.booking_id,
          total_amount: totalAmount,
          status: "approved",
        },
      });

      // Link Quotation back to RepairJob if not linked
      if (!repair.quotation_id) {
        await prisma.repairJob.update({
          where: { id: repair.id },
          data: { quotation_id: quotation.id },
        });
      }

      // Sync QuotationItems (Clean and Re-insert)
      await prisma.quotationItem.deleteMany({
        where: { quotation_id: quotation.id },
      });

      for (const rp of repair.repair_parts) {
        await prisma.quotationItem.create({
          data: {
            quotation_id: quotation.id,
            description: rp.part.name,
            part_id: rp.part_id,
            part_qty: rp.quantity,
            labor: 0, // In our model labor is lumped or per item? Here we use RepairJob.labor_cost for total labor.
          },
        });
      }

      // Add a labor item if cost > 0
      if (Number(repair.labor_cost) > 0) {
        await prisma.quotationItem.create({
          data: {
            quotation_id: quotation.id,
            description: "ค่าบริการ/ค่าแรง",
            labor: repair.labor_cost,
          },
        });
      }

      // 3. If delivered -> Create/Update Payment
      if (status === "delivered") {
        await prisma.payment.upsert({
          where: { repair_job_id: repair.id },
          update: {
            amount: totalAmount,
          },
          create: {
            repair_job_id: repair.id,
            amount: totalAmount,
            status: "pending",
            method: "CASH",
          },
        });
      }
    }

    // 4. Handle Cancellation (FR-31) -> Return all parts to stock
    if (status === "cancelled") {
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

      await prisma.$transaction(async (tx) => {
        // Return each part to stock
        for (const rp of repair.repair_parts) {
          const part = await tx.part.update({
            where: { id: rp.part_id },
            data: { stock_qty: { increment: rp.quantity } },
          });

          await tx.partInventoryLog.create({
            data: {
              part_id: rp.part_id,
              repair_job_id: repair.id,
              staff_id: user?.id,
              change_qty: rp.quantity,
              balance_after: part.stock_qty,
              type: "REPAIR_RETURN",
              note: `คืนสต็อกเนื่องจากยกเลิกงานซ่อม ID: ${repair.id.slice(-6).toUpperCase()}`,
            },
          });

          // Delete the repair part record as it's no longer used
          await tx.repairPart.delete({ where: { id: rp.id } });
        }

        // Reset labor cost and progress
        await tx.repairJob.update({
          where: { id: repair.id },
          data: {
            labor_cost: 0,
            progress: 0,
            note: note ? `[CANCELLED] ${note}` : "[CANCELLED]",
          },
        });

        // If there was a quotation, we might want to clean its items too or delete it
        if (repair.quotation_id) {
          await tx.quotationItem.deleteMany({
            where: { quotation_id: repair.quotation_id },
          });
          await tx.quotation.update({
            where: { id: repair.quotation_id },
            data: { total_amount: 0, status: "rejected" },
          });
        }

        // Delete pending payment if exists
        await tx.payment.deleteMany({
          where: {
            repair_job_id: repair.id,
            status: "pending",
          },
        });
      });
    }

    return NextResponse.json(repair);
  } catch (error) {
    console.error("Repair Job Update Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status, progress, labor_cost, note } = await request.json();

    // 1. Update Repair Job
    const updateData: any = {
      status,
      progress: progress !== undefined ? progress : undefined,
      labor_cost: labor_cost !== undefined ? labor_cost : undefined,
      note: note !== undefined ? note : undefined,
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

    return NextResponse.json(repair);
  } catch (error) {
    console.error("Repair Job Update Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

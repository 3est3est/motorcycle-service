import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { status, progress, labor_cost } = await request.json();

    const repair = await prisma.repairJob.update({
      where: { id: params.id },
      data: {
        status,
        progress: progress !== undefined ? progress : undefined,
        labor_cost: labor_cost !== undefined ? labor_cost : undefined,
      },
      include: {
        booking: {
          include: { customer: true },
        },
      },
    });

    // หากซ่อมเสร็จเงิน (delivered) -> สร้างใบกเก็บเงิน (Payment)
    if (status === "delivered") {
      // คำนวณยอดรวม (ค่าแรง + ค่าอะไหล่)
      const quotation = await prisma.quotation.findUnique({
        where: { booking_id: repair.booking_id },
        include: { items: { include: { part: true } } },
      });

      let total = Number(repair.labor_cost);
      if (quotation) {
        quotation.items.forEach((item) => {
          total +=
            Number(item.part?.price || 0) * (item.part_qty || 0) +
            Number(item.labor || 0);
        });
      }

      await prisma.payment.create({
        data: {
          repair_job_id: repair.id,
          amount: total,
          status: "pending",
          method: "CASH", // Default
        },
      });
    }

    return NextResponse.json(repair);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

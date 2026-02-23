import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/staff/repairs/[id]/parts - Get parts for a repair job
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: repair_job_id } = await params;
    const parts = await prisma.repairPart.findMany({
      where: { repair_job_id },
      include: { part: true },
    });
    return NextResponse.json(parts);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/staff/repairs/[id]/parts - Add part to repair job
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: repair_job_id } = await params;
    const { part_id, quantity } = await request.json();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check Part & Stock
      const part = await tx.part.findUnique({ where: { id: part_id } });
      if (!part) {
        throw new Error("PART_NOT_FOUND");
      }

      if (part.stock_qty < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      // 2. Deduct Stock (FR-26)
      await tx.part.update({
        where: { id: part_id },
        data: { stock_qty: { decrement: quantity } },
      });

      const price_total = Number(part.price) * quantity;

      // 3. Create RepairPart
      const repairPart = await tx.repairPart.create({
        data: {
          repair_job_id,
          part_id,
          quantity,
          unit_price: part.price,
          price_total,
        },
        include: { part: true },
      });

      return repairPart;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Add Part Error:", error);
    if (error.message === "PART_NOT_FOUND") {
      return NextResponse.json({ message: "ไม่พบอะไหล่" }, { status: 404 });
    }
    if (error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { message: "จำนวนอะไหล่ในสต็อกไม่เพียงพอ" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/staff/repairs - ดึงรายการงานซ่อมทั้งหมด
export async function GET() {
  try {
    const repairs = await prisma.repairJob.findMany({
      include: {
        booking: {
          include: {
            customer: true,
            motorcycle: true,
          },
        },
        quotation: {
          include: {
            items: {
              include: { part: true },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(repairs);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PATCH /api/staff/repairs/[id] - อัปเดตงานซ่อม
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
    });

    return NextResponse.json(repair);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

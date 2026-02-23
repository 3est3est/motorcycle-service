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

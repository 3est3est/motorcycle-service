import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/staff/bookings - ดึงรายการจองทั้งหมด (สำหรับ Staff)
export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: true,
        motorcycle: true,
      },
      orderBy: { booking_time: "asc" },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PATCH /api/staff/bookings/[id] - อัปเดตสถานะการจอง (Confirm/Cancel)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { status } = await request.json();
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: { status },
      include: {
        motorcycle: true,
        customer: true,
      },
    });

    // หากยืนยันการจอง (confirmed) -> สร้าง Repair Job รอไว้เลย
    if (status === "confirmed") {
      await prisma.repairJob.create({
        data: {
          booking_id: booking.id,
          status: "created",
          labor_cost: 0,
        },
      });
    }

    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

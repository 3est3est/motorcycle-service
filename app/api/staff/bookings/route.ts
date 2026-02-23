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

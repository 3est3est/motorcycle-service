import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/staff/estimates/[booking_id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: booking_id } = await params;
    const estimate = await prisma.estimate.findUnique({
      where: { booking_id },
    });
    return NextResponse.json(estimate);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/staff/estimates/[booking_id] - Create or Update Estimate
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: booking_id } = await params;
    const { description, estimated_cost } = await request.json();

    const estimate = await prisma.estimate.upsert({
      where: { booking_id },
      update: {
        description,
        estimated_cost,
      },
      create: {
        booking_id,
        description,
        estimated_cost,
      },
      include: {
        booking: {
          include: { customer: true },
        },
      },
    });

    // Notify Customer (FR-24)
    await prisma.notification.create({
      data: {
        user_id: estimate.booking.customer.user_id,
        title: "ใบประเมินราคามาแล้ว!",
        message: `รถของคุณ (${estimate.booking.motorcycle_id.slice(-6).toUpperCase()}) มีใบประเมินราคาพร้อมให้คุณตรวจสอบแล้ว`,
        type: "INFO",
      },
    });

    return NextResponse.json(estimate);
  } catch (error) {
    console.error("Estimate Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

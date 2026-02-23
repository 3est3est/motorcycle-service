import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    if (status === "confirmed") {
      const existingJob = await prisma.repairJob.findUnique({
        where: { booking_id: booking.id },
      });

      if (!existingJob) {
        await prisma.repairJob.create({
          data: {
            booking_id: booking.id,
            status: "created",
            labor_cost: 0,
          },
        });
      }
    }

    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

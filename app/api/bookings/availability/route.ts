import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/bookings/availability?date=YYYY-MM-DD
// Returns list of booking_time ISO strings + max per slot (FR-08)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!date) {
      return NextResponse.json(
        { message: "date query param required (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    // Query bookings for the given date (use local date range to handle timezone)
    const startOfDay = new Date(`${date}T00:00:00.000`);
    const endOfDay = new Date(`${date}T23:59:59.999`);

    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ["pending", "confirmed"] },
        booking_time: { gte: startOfDay, lte: endOfDay },
      },
      select: { booking_time: true },
      orderBy: { booking_time: "asc" },
    });

    const MAX_PER_SLOT = 3;

    // Return raw booking_time list (ISO strings) so client can group by hour
    return NextResponse.json({
      date,
      maxPerSlot: MAX_PER_SLOT,
      totalBooked: bookings.length,
      bookings: bookings.map((b) => b.booking_time.toISOString()),
    });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

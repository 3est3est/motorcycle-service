import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Role check: Only staff or admin can manage bookings
    const role = user?.user_metadata?.role;
    if (!user || (role !== "staff" && role !== "admin")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { status } = await request.json();

    // Update booking status
    const booking = await prisma.booking.update({
      where: { id: id },
      data: { status },
      include: {
        motorcycle: true,
        customer: true,
      },
    });

    // If confirmed -> create a repair job if it doesn't already exist
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
    console.error("Staff booking update error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

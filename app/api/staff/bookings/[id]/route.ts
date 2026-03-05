import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Role check: Only staff or admin can manage bookings
    const role = user?.user_metadata?.role;
    if (!user || (role !== "staff" && role !== "admin")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { status } = await request.json();

    // Use transaction to update booking status and ensure repair job exists
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update booking status
      const booking = await tx.booking.update({
        where: { id: id },
        data: { status },
        include: {
          motorcycle: true,
          customer: true,
          repair_job: true,
        },
      });

      // 2. If status is confirmed → Create repair job record if not exists
      // This will make it show up in the "งานซ่อม" (Repair Jobs) page for staff
      if (status === "confirmed" && !booking.repair_job) {
        await tx.repairJob.create({
          data: {
            booking_id: id,
            status: "created", // Status 'created' means "Wait for assessment" (รอการประเมิน)
          },
        });
      }

      // 3. If status is cancelled → Update existing repair job to cancelled if it exists
      if (status === "cancelled" && booking.repair_job) {
        await tx.repairJob.update({
          where: { booking_id: id },
          data: { status: "cancelled" },
        });
      }

      return booking;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Staff booking update error:", error);
    if ((error as any).code === "P2002") {
      // Skip if repair job already exists (double click)
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { motorcycle: true, customer: true, repair_job: true },
      });
      return NextResponse.json(booking);
    }
    return NextResponse.json({ message: "Internal Server Error", errorCode: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

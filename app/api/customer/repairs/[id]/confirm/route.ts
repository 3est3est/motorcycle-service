import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(
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
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const repair = await prisma.repairJob.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!repair)
      return NextResponse.json(
        { message: "Repair not found" },
        { status: 404 },
      );

    // Verify owner
    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });
    if (!customer || repair.booking.customer_id !== customer.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.repairJob.update({
      where: { id },
      data: { customer_confirmed: true },
      include: {
        booking: {
          include: { customer: true, motorcycle: true },
        },
      },
    });

    // Notify all staff/admin (FR-25)
    const staffs = await prisma.user.findMany({
      where: { role: { in: ["admin", "staff"] } },
      select: { id: true },
    });

    for (const s of staffs) {
      await prisma.notification.create({
        data: {
          user_id: s.id,
          title: "ลูกค้ายืนยันงานซ่อมแล้ว!",
          message: `ลูกค้า ${updated.booking.customer.full_name} ยืนยันงานซ่อมรถ ${updated.booking.motorcycle.model} (${updated.booking.motorcycle.license_plate}) พร้อมเริ่มงานทันที`,
          type: "SUCCESS",
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

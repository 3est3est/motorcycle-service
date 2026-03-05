import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// GET /api/staff/repairs/[id]/parts - Get parts for a repair job
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: repair_job_id } = await params;
    const parts = await prisma.repairPart.findMany({
      where: { repair_job_id },
      include: { part: true },
    });
    return NextResponse.json(parts);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/staff/repairs/[id]/parts - Add part to repair job
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: repair_job_id } = await params;
    const { part_id, quantity } = await request.json();

    // Get auth user
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

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check Part & Stock
      const part = await tx.part.findUnique({ where: { id: part_id } });
      if (!part) {
        throw new Error("PART_NOT_FOUND");
      }

      if (part.stock_qty < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      // 2. Deduct Stock (FR-26)
      const p = await tx.part.update({
        where: { id: part_id },
        data: { stock_qty: { decrement: quantity } },
      });

      const price_total = Number(part.price) * quantity;

      // 3. Create RepairPart
      const repairPart = await tx.repairPart.create({
        data: {
          repair_job_id,
          part_id,
          quantity,
          unit_price: part.price,
          price_total,
        },
        include: { part: true },
      });

      // 4. Log Inventory
      await tx.partInventoryLog.create({
        data: {
          part_id,
          repair_job_id,
          staff_id: user?.id,
          change_qty: -quantity,
          balance_after: p.stock_qty,
          type: "REPAIR_USE",
          note: `ใช้งานในงานซ่อม ID: ${repair_job_id.slice(-6).toUpperCase()}`,
        },
      });

      // 5. Check if stock is low -> Notify Staff
      if (p.stock_qty <= p.min_stock) {
        const staff = await tx.user.findMany({
          where: { role: { in: ["admin", "staff"] } },
          select: { id: true },
        });

        if (staff.length > 0) {
          await tx.notification.createMany({
            data: staff.map((s) => ({
              user_id: s.id,
              title: "อะไหล่ใกล้หมดสต็อก!",
              message: `${p.name} เหลือเพียง ${p.stock_qty} ชิ้น (ขั้นต่ำ ${p.min_stock})`,
              type: "STOCK_LOW",
            })),
          });
        }
      }

      return repairPart;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Add Part Error:", error);
    if (error.message === "PART_NOT_FOUND") {
      return NextResponse.json({ message: "ไม่พบอะไหล่" }, { status: 404 });
    }
    if (error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { message: "จำนวนอะไหล่ในสต็อกไม่เพียงพอ" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// DELETE /api/staff/repairs/[id]/parts - Remove a part and return to stock
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: repair_job_id } = await params;
    const { searchParams } = new URL(request.url);
    const repair_part_id = searchParams.get("id");

    if (!repair_part_id) {
      return NextResponse.json({ message: "Missing part ID" }, { status: 400 });
    }

    // Get auth user
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

    await prisma.$transaction(async (tx) => {
      // 1. Find RepairPart
      const rp = await tx.repairPart.findUnique({
        where: { id: repair_part_id },
      });

      if (!rp) throw new Error("REPAIR_PART_NOT_FOUND");

      // 2. Return to Stock
      const part = await tx.part.update({
        where: { id: rp.part_id },
        data: { stock_qty: { increment: rp.quantity } },
      });

      // 3. Delete RepairPart
      await tx.repairPart.delete({
        where: { id: repair_part_id },
      });

      // 4. Log Inventory
      await tx.partInventoryLog.create({
        data: {
          part_id: rp.part_id,
          repair_job_id,
          staff_id: user?.id,
          change_qty: rp.quantity,
          balance_after: part.stock_qty,
          type: "REPAIR_RETURN",
          note: `คืนอะไหล่จากงานซ่อม (ลบรายการ) ID: ${repair_job_id.slice(-6).toUpperCase()}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Part Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

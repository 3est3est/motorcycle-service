import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// DELETE /api/staff/repairs/parts/[id]
// When a part is removed from a repair job, stock is RESTORED (FR-26)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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
      // 1. Find the repair part to get quantity and part_id before deleting
      const repairPart = await tx.repairPart.findUnique({
        where: { id },
        include: { part: true },
      });

      if (!repairPart) {
        throw new Error("REPAIR_PART_NOT_FOUND");
      }

      // 2. Delete the repair part
      await tx.repairPart.delete({ where: { id } });

      // 3. Restore stock (increment back)
      const p = await tx.part.update({
        where: { id: repairPart.part_id },
        data: { stock_qty: { increment: repairPart.quantity } },
      });

      // 4. Log Inventory
      await tx.partInventoryLog.create({
        data: {
          part_id: repairPart.part_id,
          repair_job_id: repairPart.repair_job_id,
          staff_id: user?.id,
          change_qty: repairPart.quantity,
          balance_after: p.stock_qty,
          type: "REPAIR_RETURN",
          note: `ยกเลิกการใช้อะไหล่ในงานซ่อม ID: ${repairPart.repair_job_id.slice(-6).toUpperCase()}`,
        },
      });

      return { restored: repairPart.quantity, partName: repairPart.part.name };
    });

    return NextResponse.json({ message: "Deleted", ...result });
  } catch (error: any) {
    if (error.message === "REPAIR_PART_NOT_FOUND") {
      return NextResponse.json(
        { message: "ไม่พบรายการอะไหล่" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

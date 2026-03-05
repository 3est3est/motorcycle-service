import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { partSchema } from "@/lib/validations";

async function getStaffUser() {
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
  return user;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getStaffUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const role = user.user_metadata?.role;
    if (role !== "staff" && role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = partSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { stock_qty, ...rest } = parsed.data;

    const part = await prisma.$transaction(async (tx) => {
      const current = await tx.part.findUnique({ where: { id } });
      if (!current) throw new Error("Part not found");

      const hasStockChange =
        stock_qty !== undefined && stock_qty !== current.stock_qty;

      const p = await tx.part.update({
        where: { id },
        data: parsed.data,
      });

      if (hasStockChange) {
        const diff = stock_qty - current.stock_qty;
        await tx.partInventoryLog.create({
          data: {
            part_id: p.id,
            staff_id: user.id,
            change_qty: diff,
            balance_after: p.stock_qty,
            type: diff > 0 ? "RESTOCK" : "ADJUSTMENT",
            note: `แก้ไขข้อมูลสต็อกด้วยตนเอง (จาก ${current.stock_qty} เป็น ${p.stock_qty})`,
          },
        });

        // Check if stock is low -> Notify Staff
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
      }

      return p;
    });

    return NextResponse.json(part);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getStaffUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const role = user.user_metadata?.role;
    if (role !== "staff" && role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.part.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

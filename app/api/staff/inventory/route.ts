import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { partSchema } from "@/lib/validations";

async function getStaffUser() {
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
  return user;
}

// GET /api/staff/inventory - ค้นหาอะไหล่ (Staff/Admin only)
export async function GET(request: Request) {
  try {
    const user = await getStaffUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const role = user.user_metadata?.role;
    if (role !== "staff" && role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const parts = await prisma.part.findMany({
      where: {
        OR: [{ name: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }],
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(parts);
  } catch (error) {
    console.error("Inventory GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/staff/inventory - เพิ่มอะไหล่ใหม่ (Staff/Admin only)
export async function POST(request: Request) {
  try {
    const user = await getStaffUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const role = user.user_metadata?.role;
    if (role !== "staff" && role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = partSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
    }

    const part = await prisma.$transaction(async (tx) => {
      const p = await tx.part.create({
        data: parsed.data,
      });

      // Log initial stock
      await tx.partInventoryLog.create({
        data: {
          part_id: p.id,
          staff_id: user.id,
          change_qty: p.stock_qty,
          balance_after: p.stock_qty,
          type: "RESTOCK",
          note: "นำเข้าสินค้าใหม่ครั้งแรก",
        },
      });
      return p;
    });

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    console.error("Inventory POST Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

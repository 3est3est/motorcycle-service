import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// GET /api/staff/repairs - ดึงรายการงานซ่อมทั้งหมด (พร้อม auth check)
export async function GET() {
  try {
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
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const role = user.user_metadata?.role;
    if (role !== "staff" && role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const repairs = await prisma.repairJob.findMany({
      include: {
        booking: {
          include: {
            customer: true,
            motorcycle: true,
            estimate: true,
          },
        },
        repair_parts: {
          include: { part: true },
        },
        quotation: {
          include: {
            items: {
              include: { part: true },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(repairs);
  } catch (error) {
    console.error("Repairs GET error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

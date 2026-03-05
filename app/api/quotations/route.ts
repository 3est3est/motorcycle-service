import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/quotations - ดูรายการใบเสนอราคา (FR-16, FR-17)
export async function GET() {
  try {
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
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const role = user.user_metadata?.role;

    // Staff/Admin see all quotations
    if (role === "staff" || role === "admin") {
      const quotations = await prisma.quotation.findMany({
        include: {
          items: {
            include: { part: true },
          },
          booking: {
            include: {
              customer: true,
              motorcycle: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });
      return NextResponse.json(quotations);
    }

    // Customer sees only their own quotations
    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });

    if (!customer)
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 },
      );

    const quotations = await prisma.quotation.findMany({
      where: {
        booking: { customer_id: customer.id },
      },
      include: {
        items: {
          include: { part: true },
        },
        booking: {
          include: {
            motorcycle: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(quotations);
  } catch (error) {
    console.error("Quotations GET error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/quotations - สร้างใบเสนอราคาใหม่ (สำหรับ Staff)
export async function POST(request: Request) {
  try {
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
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const role = user.user_metadata?.role;
    if (role !== "staff" && role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { booking_id, items } = await request.json();

    if (!booking_id || !items || items.length === 0) {
      return NextResponse.json(
        { message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 },
      );
    }

    // Calculate total_amount from items
    const total_amount = items.reduce((sum: number, item: any) => {
      return sum + (item.labor || 0);
    }, 0);

    // Create or update quotation using upsert
    const quotation = await prisma.quotation.upsert({
      where: { booking_id },
      update: {
        total_amount,
        items: {
          deleteMany: {},
          create: items.map((item: any) => ({
            description: item.description,
            labor: item.labor || 0,
            part_id: item.part_id || null,
            part_qty: item.part_qty || null,
          })),
        },
      },
      create: {
        booking: { connect: { id: booking_id } },
        total_amount,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            labor: item.labor || 0,
            part_id: item.part_id || null,
            part_qty: item.part_qty || null,
          })),
        },
      },
      include: {
        items: {
          include: { part: true },
        },
      },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error("Quotation POST error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

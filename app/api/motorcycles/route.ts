import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { motorcycleSchema } from "@/lib/validations";

// GET /api/motorcycles - ดึงรายการรถของลูกค้าที่ login อยู่
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
          setAll() {}, // Server Component will handle cookies
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });

    if (!customer)
      return NextResponse.json(
        { message: "Customer profile not found" },
        { status: 404 },
      );

    const motorcycles = await prisma.motorcycle.findMany({
      where: { customer_id: customer.id },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(motorcycles);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/motorcycles - เพิ่มรถใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = motorcycleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

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

    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });

    if (!customer)
      return NextResponse.json(
        { message: "Customer profile not found" },
        { status: 404 },
      );

    const motorcycle = await prisma.motorcycle.create({
      data: {
        ...parsed.data,
        customer_id: customer.id,
      },
    });

    return NextResponse.json(motorcycle, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "เลขทะเบียนนี้มีอยู่ในระบบแล้ว" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

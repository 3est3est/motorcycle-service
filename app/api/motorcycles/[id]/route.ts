import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });

    if (!customer) return NextResponse.json({ message: "Customer profile not found" }, { status: 404 });

    // ตรวจสอบว่าเป็นเจ้าของรถจริงไหมก่อนลบ
    const motorcycle = await prisma.motorcycle.findUnique({
      where: { id },
    });

    if (!motorcycle || motorcycle.customer_id !== customer.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.motorcycle.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
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

    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });

    if (!customer) return NextResponse.json({ message: "Customer profile not found" }, { status: 404 });

    // Check ownership
    const motorcycle = await prisma.motorcycle.findUnique({
      where: { id },
    });

    if (!motorcycle || motorcycle.customer_id !== customer.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.motorcycle.update({
      where: { id },
      data: {
        brand: body.brand,
        model: body.model,
        license_plate: body.license_plate,
        year: body.year ? Number(body.year) : null,
        image_url: body.image_url,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

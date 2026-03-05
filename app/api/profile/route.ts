import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  phone: z.string().regex(/^[0-9]{9,10}$/, "เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก"),
  image_url: z.string().optional().nullable(),
});

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

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        customer: {
          include: { loyalty_points: true },
        },
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: dbUser?.customer?.full_name || "",
      phone: dbUser?.customer?.phone || "",
      image_url: dbUser?.customer?.image_url || "",
      role: dbUser?.role || "customer",
      loyalty_points: dbUser?.customer?.loyalty_points?.total_points || 0,
    });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
    }

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

    const customer = await prisma.customer.update({
      where: { user_id: user.id },
      data: parsed.data,
    });

    // Also update Supabase metadata for consistency
    await supabase.auth.updateUser({
      data: {
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        image_url: parsed.data.image_url,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

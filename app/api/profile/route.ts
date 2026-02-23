import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  phone: z.string().regex(/^[0-9]{9,10}$/, "เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก"),
});

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

    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });

    return NextResponse.json({
      email: user.email,
      full_name: customer?.full_name || "",
      phone: customer?.phone || "",
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

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

    const customer = await prisma.customer.update({
      where: { user_id: user.id },
      data: parsed.data,
    });

    // Also update Supabase metadata for consistency
    await supabase.auth.updateUser({
      data: {
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

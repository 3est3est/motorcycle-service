import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email, password, full_name, phone } = parsed.data;
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone,
          role: "customer",
        },
      },
    });

    if (error) {
      let message = "ไม่สามารถสมัครสมาชิกได้";
      if (error.message.includes("already registered")) {
        message = "อีเมลนี้ถูกใช้งานแล้ว";
      } else if (error.message.includes("password")) {
        message = "รหัสผ่านไม่ตรงตามเงื่อนไข";
      }
      return NextResponse.json({ message }, { status: 400 });
    }

    return NextResponse.json({
      message: "สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมล",
      user: data.user,
    });
  } catch {
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 },
    );
  }
}

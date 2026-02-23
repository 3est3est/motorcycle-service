import { createAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations";
import { $Enums } from "@prisma/client"; // Use $Enums for compatibility with Next.js 15+ and Vercel builds

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

    const { email, password, full_name, phone, inviteCode } = parsed.data;

    // Determine role based on invite code
    let role = "customer";
    if (inviteCode === "MTD-STAFF") {
      role = "staff";
    } else if (inviteCode === "MTD-ADMIN") {
      role = "admin";
    }

    // Use Admin Client to bypass email confirmation rate limits during testing
    const supabase = await createAdminClient();

    // 1. Create User via Admin API (Auto-confirms the email)
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email to bypass rate limits
        user_metadata: {
          full_name,
          phone,
          role,
        },
      });

    if (authError) {
      console.error("Supabase Admin createUser error:", authError);
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    const newUser = authData.user!;

    // 2. Sync to Prisma Database (Manual sync because it's an admin creation)
    const dbUser = await prisma.user.create({
      data: {
        id: newUser.id,
        email: newUser.email!,
        role: role as $Enums.UserRole,
        customer: {
          create: {
            full_name,
            phone,
          },
        },
      },
    });

    return NextResponse.json({
      message: "สมัครสมาชิกสำเร็จและเข้าใช้งานได้ทันที",
      user: newUser,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 },
    );
  }
}

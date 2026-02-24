import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/admin/users - List all users
export async function GET() {
  try {
    const supabase = await createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userRole = user?.user_metadata?.role;
    if (!user || (userRole !== "admin" && userRole !== "staff")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: { customer: true },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/admin/users - Create a new user (Staff/Admin)
export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient();
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser();

    if (!adminUser || adminUser.user_metadata.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, full_name, role, phone } = body;

    if (!email || !full_name || !role) {
      return NextResponse.json(
        { message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 },
      );
    }

    // 1. Create User in Supabase Auth (using Admin Auth API)
    // Generate a secure random temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + "A1!";

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Confirm email automatically
        user_metadata: {
          full_name,
          phone: phone || "",
          role: role,
        },
      });

    if (authError) {
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    const newUser = authData.user!;

    // 2. Sync to Prisma Database
    await prisma.user.create({
      data: {
        id: newUser.id,
        email: newUser.email!,
        role: role,
        customer: {
          create: {
            full_name,
            phone: phone || "",
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "สร้างบัญชีผู้ใช้สำเร็จ",
      tempPassword,
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
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

    // 1. Check if the requester is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.user_metadata.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { role } = await request.json();
    if (!["customer", "staff", "admin"].includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    // 2. Update role in Prisma (public schema)
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role: role as any },
    });

    // 3. Update role in Supabase Auth Metadata (important for Middleware and Sidebar)
    // We need service role key for this to bypass RLS and manage other users
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use Service Role Key
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      },
    );

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      params.id,
      { user_metadata: { role: role } },
    );

    if (authError) {
      console.error("Auth update error:", authError);
      return NextResponse.json(
        { message: "Failed to update auth metadata" },
        { status: 500 },
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

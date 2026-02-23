import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users - List all users with details
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
    if (!user || user.user_metadata.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        customer: true,
      },
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

// PATCH /api/admin/users/[id] - Update user role
// Note: We'll normally handle this in a separate dynamic route file, but I'll define it here for logic check first.
// Actually, let's create the dynamic route file directly.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// PATCH /api/staff/users/[id]/role - Update user role
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: userId } = await params;
    const { role } = await request.json();

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
      data: { user: authUser },
    } = await supabase.auth.getUser();

    // Check if the current user is an admin
    if (!authUser || authUser.user_metadata?.role !== "admin") {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    if (!role || !["customer", "staff", "admin"].includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    // Role updates usually need to be done in Supabase Auth as well
    // But since the middleware/app logic relies on DB and user_metadata which we sync,
    // we'll update the DB here.
    // NOTE: Real-world apps should use Supabase Admin API to update user_metadata.
    // For now, we update the Prisma User record and assume meta syncs or is updated via Supabase separately.
    // However, our app reads from DB in many places.

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("User Role Update Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

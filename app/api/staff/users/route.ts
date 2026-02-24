import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// GET /api/staff/users - List all customers (for Staff)
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
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // sessions.
            }
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check role: must be staff or admin
    const userRole = user?.user_metadata?.role;
    if (!user || (userRole !== "staff" && userRole !== "admin")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Staff sees everyone or just customers?
    // User request: "สามารถดูได้ว่ามีลูกค้าคนไหนบ้าง เหมือน admin ที่ดูได้ ว่ามี พนักงาน ลูก้าคนไหนบ้าง"
    // This implies staff might want to see staff too, or at least the logic for viewing.
    // Let's allow staff to see all users but only with "customer" and "staff" roles?
    // Usually admin sees everything. Staff sees colleagues and customers.

    const users = await prisma.user.findMany({
      include: { customer: true },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Staff fetch users error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

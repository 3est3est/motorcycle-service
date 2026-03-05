import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (
      !userProfile ||
      (userProfile.role !== "staff" && userProfile.role !== "admin")
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const payments = await prisma.payment.findMany({
      include: {
        repair_job: {
          include: {
            booking: {
              include: {
                customer: true,
                motorcycle: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appendFileSync } from "fs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        motorcycle: true,
        customer: true,
        repair_job: {
          include: {
            repair_parts: {
              include: {
                part: true,
              },
            },
            payments: true,
            staff: {
              include: {
                customer: {
                  select: {
                    full_name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // Security: Get current user role and customer ID
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { customer: true },
    });

    if (!dbUser) {
      return NextResponse.json({ message: "User profile not found" }, { status: 404 });
    }

    const isStaff = dbUser.role === "admin" || dbUser.role === "staff";
    const isOwner = dbUser.customer?.id === booking.customer_id;

    if (!isStaff && !isOwner) {
      return NextResponse.json({ message: "Access Denied" }, { status: 403 });
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("CRITICAL API ERROR:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

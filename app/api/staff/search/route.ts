import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ repairs: [], customers: [], parts: [] });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userRole = user?.user_metadata?.role;
    if (!user || (userRole !== "staff" && userRole !== "admin")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Parallel searches
    const [repairs, customers, parts] = await Promise.all([
      // 1. Search Repairs (by License Plate)
      prisma.repairJob.findMany({
        where: {
          OR: [
            {
              booking: {
                motorcycle: {
                  license_plate: { contains: query, mode: "insensitive" },
                },
              },
            },
          ],
        },
        include: {
          booking: {
            include: {
              motorcycle: true,
              customer: true,
            },
          },
        },
        take: 5,
      }),
      // 2. Search Customers (by name or phone)
      prisma.customer.findMany({
        where: {
          OR: [{ full_name: { contains: query, mode: "insensitive" } }, { phone: { contains: query, mode: "insensitive" } }],
        },
        take: 5,
      }),
      // 3. Search Parts (by name)
      prisma.part.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      repairs: (repairs as any[]).map((r) => ({
        id: r.id,
        title: `${r.booking.motorcycle.brand} ${r.booking.motorcycle.model}`,
        subtitle: r.booking.motorcycle.license_plate,
        type: "REPAIR",
      })),
      customers: (customers as any[]).map((c) => ({
        id: c.id,
        title: c.full_name,
        subtitle: c.phone,
        type: "CUSTOMER",
      })),
      parts: (parts as any[]).map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: `${p.stock_qty} in stock`,
        type: "PART",
      })),
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

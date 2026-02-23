import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { partSchema } from "@/lib/validations";

// GET /api/parts - ค้นหาอะไหล่
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const parts = await prisma.part.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(parts);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/parts - เพิ่มอะไหล่ใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = partSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { name, description, price, stock_qty } = parsed.data;

    const part = await prisma.part.create({
      data: {
        name,
        description,
        price,
        stock_qty,
      },
    });

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

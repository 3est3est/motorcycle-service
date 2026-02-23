import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingSchema } from "@/lib/validations";

// GET /api/bookings - Get user's bookings
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

    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });

    if (!customer)
      return NextResponse.json(
        { message: "Customer profile not found" },
        { status: 404 },
      );

    const bookings = await prisma.booking.findMany({
      where: { customer_id: customer.id },
      include: {
        motorcycle: true,
        repair_job: true,
      },
      orderBy: { booking_time: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

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

    const customer = await prisma.customer.findUnique({
      where: { user_id: user.id },
    });

    if (!customer)
      return NextResponse.json(
        { message: "Customer profile not found" },
        { status: 404 },
      );

    // Validate motorcycle belongs to customer
    const motorcycle = await prisma.motorcycle.findUnique({
      where: { id: parsed.data.motorcycle_id },
    });

    if (!motorcycle || motorcycle.customer_id !== customer.id) {
      return NextResponse.json(
        { message: "Invalid motorcycle" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.create({
      data: {
        customer_id: customer.id,
        motorcycle_id: parsed.data.motorcycle_id,
        booking_time: new Date(parsed.data.booking_time),
        symptom_note: parsed.data.symptom_note,
        status: "pending",
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

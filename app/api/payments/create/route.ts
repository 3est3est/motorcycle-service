import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// POST /api/payments/create - สร้าง payment bill และเลือกวิธีชำระ (FR-27, FR-28)
export async function POST(request: Request) {
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

    const role = user.user_metadata?.role;
    if (role !== "staff" && role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { repair_job_id, amount, method } = await request.json();

    if (!repair_job_id || !amount || !method) {
      return NextResponse.json(
        { message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 },
      );
    }

    if (!["CASH", "TRANSFER", "QR_TRANSFER"].includes(method)) {
      return NextResponse.json(
        { message: "วิธีชำระเงินไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { repair_job_id },
    });

    if (existingPayment) {
      return NextResponse.json(
        { message: "มีบิลนี้อยู่แล้วในระบบ" },
        { status: 400 },
      );
    }

    const payment = await prisma.payment.create({
      data: {
        repair_job_id,
        amount,
        method,
        status: "pending",
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

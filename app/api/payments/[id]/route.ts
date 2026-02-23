import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (status !== "success") {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    // 1. Get Payment & Check if already success
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        repair_job: {
          include: {
            booking: {
              include: { customer: true },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { message: "Payment not found" },
        { status: 404 },
      );
    }

    if (payment.status === "success") {
      return NextResponse.json(
        { message: "Payment already processed" },
        { status: 400 },
      );
    }

    // 2. Update Payment & Handle Loyalty Points in Transaction
    const result = await prisma.$transaction(async (tx) => {
      // A. Update Payment
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: {
          status: "success",
          paid_at: new Date(),
        },
      });

      // B. Update Repair Job status to delivered if it's not already
      // (Usually it's delivered before payment, but good to be sure)
      await tx.repairJob.update({
        where: { id: payment.repair_job_id },
        data: { status: "delivered" },
      });

      // C. Point Engine (FR-30): 10 Baht = 1 Point
      const pointsEarned = Math.floor(Number(payment.amount) / 10);

      if (pointsEarned > 0) {
        // Find or Create LoyaltyPoints record
        const loyaltyPoints = await tx.loyaltyPoints.upsert({
          where: { customer_id: payment.repair_job.booking.customer_id },
          create: {
            customer_id: payment.repair_job.booking.customer_id,
            total_points: pointsEarned,
          },
          update: {
            total_points: { increment: pointsEarned },
          },
        });

        // Log Transaction
        await tx.pointTransaction.create({
          data: {
            loyalty_points_id: loyaltyPoints.id,
            payment_id: payment.id,
            event_type: "earn",
            points: pointsEarned,
          },
        });
      }

      return updatedPayment;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Payment Update Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

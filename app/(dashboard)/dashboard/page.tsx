import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Wrench,
  CreditCard,
  Star,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "แดชบอร์ด",
};

const bookingStatusConfig = {
  pending: { label: "รอยืนยัน", variant: "pending" as const, icon: Clock },
  confirmed: {
    label: "ยืนยันแล้ว",
    variant: "confirmed" as const,
    icon: CheckCircle2,
  },
  cancelled: {
    label: "ยกเลิก",
    variant: "cancelled" as const,
    icon: AlertCircle,
  },
  completed: {
    label: "เสร็จสิ้น",
    variant: "completed" as const,
    icon: CheckCircle2,
  },
};

const repairStatusLabel: Record<string, string> = {
  created: "สร้างแล้ว",
  in_progress: "กำลังซ่อม",
  completed: "ซ่อมเสร็จ",
  delivered: "ส่งมอบแล้ว",
};

export default async function DashboardPage() {
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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Fetch real data from DB
  let customerName = authUser?.user_metadata?.full_name ?? "ผู้ใช้งาน";
  let recentBookings: Array<{
    id: string;
    booking_time: Date;
    status: string;
    motorcycle: { brand: string; model: string } | null;
  }> = [];
  let loyaltyPoints = 0;
  let activeRepairJob: {
    id: string;
    status: string;
    labor_cost: { toNumber: () => number };
  } | null = null;
  let pendingPaymentTotal = 0;
  let nextBooking: {
    id: string;
    booking_time: Date;
    status: string;
    motorcycle: { brand: string; model: string; license_plate: string } | null;
  } | null = null;

  if (authUser) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { user_id: authUser.id },
        include: {
          loyalty_points: true,
          bookings: {
            orderBy: { booking_time: "desc" },
            take: 5,
            include: { motorcycle: true },
          },
        },
      });

      if (customer) {
        customerName = customer.full_name;
        loyaltyPoints = customer.loyalty_points?.total_points ?? 0;
        recentBookings = customer.bookings;

        // Next upcoming booking
        nextBooking =
          customer.bookings.find(
            (b) => b.status === "confirmed" && b.booking_time > new Date(),
          ) ?? null;

        // Active repair job
        const repairJob = await prisma.repairJob.findFirst({
          where: {
            booking: { customer_id: customer.id },
            status: { in: ["created", "in_progress"] },
          },
          orderBy: { created_at: "desc" },
        });
        activeRepairJob = repairJob;

        // Pending payments
        const pendingPayments = await prisma.payment.findMany({
          where: {
            repair_job: { booking: { customer_id: customer.id } },
            status: "pending",
          },
        });
        pendingPaymentTotal = pendingPayments.reduce(
          (sum, p) => sum + p.amount.toNumber(),
          0,
        );
      }
    } catch {
      // Use empty state if DB fetch fails
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="แดชบอร์ด" subtitle={`ยินดีต้อนรับ ${customerName}`} />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "การจองถัดไป",
              value: nextBooking
                ? new Date(nextBooking.booking_time).toLocaleDateString(
                    "th-TH",
                    { day: "numeric", month: "short", year: "numeric" },
                  )
                : "ไม่มีการจอง",
              sub: nextBooking
                ? new Date(nextBooking.booking_time).toLocaleTimeString(
                    "th-TH",
                    { hour: "2-digit", minute: "2-digit" },
                  ) + " น."
                : "จองคิวซ่อมได้เลย",
              icon: Calendar,
              color: "text-primary",
              bg: "bg-primary/10",
              href: "/bookings",
            },
            {
              label: "งานซ่อมปัจจุบัน",
              value: activeRepairJob
                ? `RJ-${activeRepairJob.id.slice(-4).toUpperCase()}`
                : "ไม่มีงานซ่อม",
              sub: activeRepairJob
                ? repairStatusLabel[activeRepairJob.status]
                : "-",
              icon: Wrench,
              color: "text-warning",
              bg: "bg-warning/10",
              href: "/repair-jobs",
            },
            {
              label: "ค้างชำระ",
              value:
                pendingPaymentTotal > 0
                  ? `฿${pendingPaymentTotal.toLocaleString("th-TH")}`
                  : "ไม่มียอดค้าง",
              sub: pendingPaymentTotal > 0 ? "กดเพื่อชำระเงิน" : "ชำระครบแล้ว",
              icon: CreditCard,
              color: "text-destructive",
              bg: "bg-destructive/10",
              href: "/payments",
            },
            {
              label: "คะแนนสะสม",
              value: loyaltyPoints.toLocaleString("th-TH"),
              sub: "แต้ม",
              icon: Star,
              color: "text-success",
              bg: "bg-success/10",
              href: "/points",
            },
          ].map(({ label, value, sub, icon: Icon, color, bg, href }) => (
            <Link key={label} href={href}>
              <Card className="group hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer h-full">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {label}
                  </p>
                  <p className="font-bold text-foreground text-sm sm:text-base truncate">
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground/70 truncate">
                    {sub}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">การจองล่าสุด</CardTitle>
              <Link href="/bookings">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary h-7 px-2"
                >
                  ดูทั้งหมด
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentBookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm mb-4">ยังไม่มีประวัติการจอง</p>
                <Link href="/bookings">
                  <Button size="sm" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    จองคิวซ่อมแรก
                  </Button>
                </Link>
              </div>
            ) : (
              recentBookings.map((booking, idx) => {
                const status =
                  booking.status as keyof typeof bookingStatusConfig;
                const cfg =
                  bookingStatusConfig[status] ?? bookingStatusConfig.pending;
                return (
                  <div
                    key={booking.id}
                    className={`flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors ${
                      idx < recentBookings.length - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {booking.motorcycle?.brand}{" "}
                          {booking.motorcycle?.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.booking_time).toLocaleDateString(
                            "th-TH",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge variant={cfg.variant} className="shrink-0 ml-3">
                      {cfg.label}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "จองคิวซ่อม", href: "/bookings", icon: Calendar },
            { label: "เพิ่มรถ", href: "/motorcycles", icon: Wrench },
            { label: "ดูการชำระเงิน", href: "/payments", icon: CreditCard },
            { label: "คะแนนสะสม", href: "/points", icon: Star },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href}>
              <div className="group p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-center cursor-pointer">
                <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors mx-auto mb-2" />
                <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

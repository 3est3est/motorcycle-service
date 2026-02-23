import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
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
  Bike,
  Users,
  Package,
  Hammer,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { th } from "date-fns/locale";

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

  const userRole = authUser?.user_metadata?.role || "customer";
  const isStaff = userRole === "admin" || userRole === "staff";

  // Data for different roles
  let customerName = authUser?.user_metadata?.full_name ?? "ผู้ใช้งาน";
  let stats = {
    confirmedBookings: 0,
    activeRepairs: 0,
    inventory: 0,
    loyaltyPoints: 0,
    pendingPayments: 0,
  };

  let listData: any[] = [];

  if (authUser) {
    try {
      if (isStaff) {
        const [pendingBookings, activeRepairs, lowStockParts] =
          await Promise.all([
            prisma.booking.count({ where: { status: "pending" } }),
            prisma.repairJob.count({ where: { status: "in_progress" } }),
            prisma.part.count({ where: { stock_qty: { lt: 5 } } }),
          ]);

        stats = {
          confirmedBookings: pendingBookings,
          activeRepairs: activeRepairs,
          inventory: lowStockParts,
          loyaltyPoints: 0,
          pendingPayments: 0,
        };

        listData = await prisma.booking.findMany({
          orderBy: { booking_time: "asc" },
          take: 5,
          include: { customer: true, motorcycle: true },
          where: { status: "pending" },
        });
      } else {
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
          const pendingPaymentsCount = await prisma.payment.count({
            where: {
              repair_job: { booking: { customer_id: customer.id } },
              status: "pending",
            },
          });

          stats = {
            confirmedBookings: customer.bookings.filter(
              (b) => b.status === "confirmed",
            ).length,
            activeRepairs: await prisma.repairJob.count({
              where: {
                booking: { customer_id: customer.id },
                status: "in_progress",
              },
            }),
            inventory: 0,
            loyaltyPoints: customer.loyalty_points?.total_points ?? 0,
            pendingPayments: pendingPaymentsCount,
          };
          listData = customer.bookings;
        }
      }
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <TopBar
        title="แดชบอร์ด"
        subtitle={`สวัสดีคุณ ${customerName} • ${userRole === "admin" ? "ผู้ดูแลระบบ" : userRole === "staff" ? "พนักงาน" : "ลูกค้า"}`}
      />

      <div className="p-4 sm:p-10 space-y-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <MetricCard
            label="คิวที่ยืนยัน"
            value={stats.confirmedBookings}
            icon={Calendar}
            variant="primary"
            sub="เตรียมเข้ารับบริการ"
            href={isStaff ? "/admin" : "/bookings"}
            className="accent-glow"
          />
          <MetricCard
            label="งานซ่อม"
            value={stats.activeRepairs}
            icon={Hammer}
            variant="warning"
            sub="ติดตามสถานะล่าสุด"
            href={isStaff ? "/repair-jobs" : "#"}
            className="accent-glow-wa"
          />
          <MetricCard
            label="ยอดค้างชำระ"
            value={isStaff ? stats.inventory : stats.pendingPayments}
            icon={isStaff ? Package : CreditCard}
            variant="danger"
            sub={isStaff ? "อะไหล่สต็อกต่ำ" : "ใบแจ้งหนี้ใหม่"}
            href={isStaff ? "/parts" : "/payments"}
            className="accent-glow"
          />
          <MetricCard
            label={isStaff ? "สิทธิ์การใช้งาน" : "คะแนนสะสม"}
            value={
              isStaff
                ? userRole === "admin"
                  ? "Admin"
                  : "Staff"
                : stats.loyaltyPoints
            }
            icon={isStaff ? Users : Star}
            variant="success"
            sub={isStaff ? "การเข้าถึงระบบ" : "แต้มสะสมทั้งหมด"}
            href={isStaff ? "/users" : "/points"}
            className="accent-glow-su"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Activity */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                {isStaff ? "รายการจองที่รอดำเนินการ" : "ประวัติการจองล่าสุด"}
              </h3>
              <Link href={isStaff ? "/admin" : "/bookings"}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary font-bold hover:bg-primary/5"
                >
                  ดูทั้งหมด <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <Card className="card-minimal overflow-hidden border-none shadow-none">
              <CardContent className="p-0">
                {listData.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center space-y-3 opacity-40">
                    <Calendar className="w-16 h-16 stroke-[1.5]" />
                    <p className="text-sm font-medium">
                      ไม่มีรายการในรายการแสดงขณะนี้
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {listData.map((item) => (
                      <div
                        key={item.id}
                        className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                            <Bike className="w-6 h-6 text-muted-foreground/70" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-base truncate">
                              {isStaff
                                ? item.customer?.full_name
                                : `${item.motorcycle?.brand} ${item.motorcycle?.model}`}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                              {format(
                                new Date(item.booking_time),
                                "d MMM yyyy",
                                { locale: th },
                              )}
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                              {format(new Date(item.booking_time), "HH:mm น.", {
                                locale: th,
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={`px-4 py-1 rounded-xl font-bold uppercase tracking-wider text-[10px] ${
                            bookingStatusConfig[
                              item.status as keyof typeof bookingStatusConfig
                            ]?.variant === "pending"
                              ? "badge-pending"
                              : bookingStatusConfig[
                                    item.status as keyof typeof bookingStatusConfig
                                  ]?.variant === "confirmed"
                                ? "badge-confirmed"
                                : bookingStatusConfig[
                                      item.status as keyof typeof bookingStatusConfig
                                    ]?.variant === "completed"
                                  ? "badge-completed"
                                  : "badge-cancelled"
                          }`}
                        >
                          {bookingStatusConfig[
                            item.status as keyof typeof bookingStatusConfig
                          ]?.label || item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Tools */}
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold">เข้าถึงด่วน</h3>
              <div className="grid grid-cols-2 gap-4">
                {isStaff ? (
                  <>
                    <ActionButton
                      label="รับคิวจอง"
                      href="/admin"
                      icon={Calendar}
                    />
                    <ActionButton label="อะไหล่" href="/parts" icon={Package} />
                    <ActionButton
                      label="งานซ่อม"
                      href="/repair-jobs"
                      icon={Wrench}
                    />
                    <ActionButton
                      label="ผู้ใช้งาน"
                      href="/users"
                      icon={Users}
                    />
                  </>
                ) : (
                  <>
                    <ActionButton
                      label="จองคิวใหม่"
                      href="/bookings"
                      icon={Calendar}
                    />
                    <ActionButton
                      label="รถของฉัน"
                      href="/motorcycles"
                      icon={Bike}
                    />
                    <ActionButton
                      label="จ่ายเงิน"
                      href="/payments"
                      icon={CreditCard}
                    />
                    <ActionButton label="เช็คแต้ม" href="/points" icon={Star} />
                  </>
                )}
              </div>
            </div>

            <div className="card-minimal p-7 overflow-hidden relative group accent-glow active-bounce">
              <div className="relative z-10 space-y-6 text-center">
                <div className="inline-flex p-5 rounded-[2.5rem] bg-primary/10 text-primary transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500">
                  <Star className="w-12 h-12 opacity-80" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-2xl tracking-tight">
                    Loyalty Rewards
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed px-4 opacity-70">
                    สะสมแต้มทุกการใช้จ่าย 100 บาท รับ 10 แต้ม
                    เพื่อแลกรับส่วนลดสุดพิเศษ
                  </p>
                </div>
                <Link href="/points" className="block pt-2">
                  <button className="btn btn-primary btn-md rounded-2xl w-full font-bold shadow-xl shadow-primary/20 active-bounce">
                    สำรวจรางวัล
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  sub,
  href,
  variant,
  className,
}: any) {
  const colors = {
    primary: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    warning: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    danger: "text-rose-600 bg-rose-500/10 border-rose-500/20",
    success: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  };

  const glowClass = className || "";

  return (
    <Link
      href={href}
      className={`glass-card border border-border/10 bg-card/10 backdrop-blur-xl p-0.5 rounded-[2rem] overflow-hidden group transition-liquid active-bounce ${glowClass}`}
    >
      <div className="stat px-8 py-8 relative z-10">
        <div
          className={`stat-figure p-4 rounded-3xl ${colors[variant as keyof typeof colors]} transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-opacity-20`}
        >
          <Icon className="w-10 h-10 stroke-[1.25]" />
        </div>
        <div className="stat-desc font-black text-[11px] uppercase tracking-[0.3em] text-muted-foreground/50 mb-3">
          {label}
        </div>
        <div className="stat-value text-4xl font-black tracking-tight flex items-baseline gap-1">
          {value}
          <span className="text-xs font-bold text-muted-foreground ml-1">
            รายการ
          </span>
        </div>
        <div className="stat-desc mt-4 flex items-center gap-1.5 opacity-60 font-bold text-xs">
          {sub}{" "}
          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}

function ActionButton({ label, href, icon: Icon }: any) {
  return (
    <Link
      href={href}
      className="btn btn-ghost h-auto py-8 flex flex-col gap-5 rounded-[2rem] bg-secondary/5 border border-border/5 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-liquid active-bounce group"
    >
      <div className="w-14 h-14 rounded-[1.5rem] bg-white dark:bg-black/20 shadow-sm border border-border/5 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:bg-primary/20 group-hover:text-primary">
        <Icon className="w-7 h-7 stroke-[1.25]" />
      </div>
      <span className="text-[11px] font-black text-muted-foreground group-hover:text-primary tracking-[0.2em] uppercase">
        {label}
      </span>
    </Link>
  );
}

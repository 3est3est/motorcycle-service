"use client";

import { useState } from "react";
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
  Loader2,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { RepairStatusModal } from "./repair-status-modal";
import { cn, formatCurrency } from "@/lib/utils";

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

const statusConfig: Record<string, { label: string; variant: any; icon: any }> =
  {
    created: { label: "รอซ่อม/รอยืนยันราคา", variant: "warning", icon: Clock },
    in_progress: {
      label: "กำลังดำเนินการซ่อม",
      variant: "confirmed",
      icon: Wrench,
    },
    completed: {
      label: "ซ่อมเสร็จสิ้น",
      variant: "completed",
      icon: CheckCircle2,
    },
    delivered: { label: "ส่งมอบรถแล้ว", variant: "outline", icon: Package },
  };

export default function DashboardPage() {
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json();
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold animate-pulse uppercase tracking-widest text-xs">
          กำลังโหลดความก้าวหน้าของคุณ...
        </p>
      </div>
    );
  }

  const { stats, listData, customerName, activeRepairs = [] } = data;
  const isCustomer = !!data.activeRepairs;
  const isStaff = !isCustomer;

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <TopBar
        title="แดชบอร์ด"
        subtitle={`สวัสดีคุณ ${customerName} • ${isStaff ? "พนักงาน" : "ลูกค้า"}`}
      />

      <div className="p-4 sm:p-10 space-y-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <MetricCard
            label="คิวที่ยืนยัน"
            value={stats.confirmedBookings}
            icon={Calendar}
            variant="primary"
            sub="เตรียมเข้ารับบริการ"
            href={!isCustomer ? "/admin" : "/bookings"}
            className="accent-glow"
          />
          <MetricCard
            label="งานซ่อม"
            value={stats.activeRepairs}
            icon={Hammer}
            variant="warning"
            sub={
              isCustomer && stats.activeRepairs > 0
                ? "มีงานซ่อมเคลื่อนไหว!"
                : "ติดตามสถานะล่าสุด"
            }
            href={!isCustomer ? "/repair-jobs" : undefined}
            onClick={() => {
              if (isCustomer && activeRepairs.length > 0) {
                setSelectedRepairId(activeRepairs[0].id);
              }
            }}
            className={cn(
              "accent-glow-wa",
              isCustomer &&
                stats.activeRepairs > 0 &&
                "ring-2 ring-warning ring-offset-4 ring-offset-background",
            )}
          />
          <MetricCard
            label="ยอดค้างชำระ"
            value={!isCustomer ? stats.inventory : stats.pendingPayments}
            icon={!isCustomer ? Package : CreditCard}
            variant="danger"
            sub={!isCustomer ? "อะไหล่สต็อกต่ำ" : "ใบแจ้งหนี้ใหม่"}
            href={!isCustomer ? "/parts" : "/payments"}
            className="accent-glow"
          />
          <MetricCard
            label={!isCustomer ? "รายรับรวม" : "คะแนนสะสม"}
            value={
              !isCustomer
                ? formatCurrency(stats.loyaltyPoints)
                : stats.loyaltyPoints
            }
            icon={!isCustomer ? DollarSign : Star}
            variant="success"
            sub={!isCustomer ? "จากยอดที่ชำระสำเร็จ" : "แต้มสะสมทั้งหมด"}
            href={!isCustomer ? "/payments" : "/points"}
            className="accent-glow-su"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Active Repairs Section */}
            {isCustomer && activeRepairs.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-tight">
                    <div className="w-2 h-8 bg-warning rounded-full" />
                    รถที่อยู่ระหว่างดำเนินการ ({activeRepairs.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeRepairs.map((rj: any) => (
                    <Card
                      key={rj.id}
                      className="glass-card overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all cursor-pointer group active:scale-[0.98]"
                      onClick={() => setSelectedRepairId(rj.id)}
                    >
                      <CardContent className="p-0">
                        <div className="p-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden shadow-inner">
                                {rj.booking?.motorcycle?.image_url ? (
                                  <img
                                    src={rj.booking.motorcycle.image_url}
                                    alt="Bike"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Bike className="w-6 h-6" />
                                )}
                              </div>
                              <div>
                                <p className="font-black text-lg leading-tight tracking-tight">
                                  {rj.booking.motorcycle.brand}{" "}
                                  {rj.booking.motorcycle.model}
                                </p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5 tracking-widest">
                                  ทะเบียน {rj.booking.motorcycle.license_plate}
                                </p>
                              </div>
                            </div>
                            {!rj.customer_confirmed && rj.booking.estimate && (
                              <Badge
                                variant="warning"
                                className="animate-pulse font-black text-[9px] uppercase px-2 py-0.5 rounded-lg shadow-sm shadow-warning/20"
                              >
                                รอยืนยันราคา
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">
                                สถานะการซ่อม
                              </span>
                              <span className="text-sm font-black text-primary">
                                {rj.progress}%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${rj.progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/10">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                {statusConfig[rj.status]?.label || rj.status}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[10px] font-black uppercase text-primary hover:bg-primary/5 p-0"
                            >
                              รายละเอียด{" "}
                              <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {!isCustomer
                    ? "รายการจองที่รอดำเนินการ"
                    : "ประวัติการจองล่าสุด"}
                </h3>
                <Link href={!isCustomer ? "/admin" : "/bookings"}>
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
                      {listData.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors group"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform overflow-hidden">
                              {item.motorcycle?.image_url ? (
                                <img
                                  src={item.motorcycle.image_url}
                                  alt="Motorcycle"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Bike className="w-6 h-6 text-muted-foreground/70" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-base truncate">
                                {!isCustomer
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
                                {format(
                                  new Date(item.booking_time),
                                  "HH:mm น.",
                                  {
                                    locale: th,
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {isCustomer && item.repair && (
                              <Button
                                size="sm"
                                variant="warning"
                                className="h-8 rounded-lg text-[10px] font-black uppercase px-3 shadow-md shadow-warning/20 border-none"
                                onClick={() =>
                                  setSelectedRepairId(item.repair.id)
                                }
                              >
                                ติดตามสถานะ
                              </Button>
                            )}
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
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold">เข้าถึงด่วน</h3>
              <div className="grid grid-cols-2 gap-4">
                {!isCustomer ? (
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

      <RepairStatusModal
        repairId={selectedRepairId}
        onClose={() => setSelectedRepairId(null)}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  sub,
  href,
  onClick,
  variant,
  className,
}: any) {
  const colors = {
    primary: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    warning: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    danger: "text-rose-600 bg-rose-500/10 border-rose-500/20",
    success: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  };

  const Content = (
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
  );

  const cardClasses = cn(
    "glass-card border border-border/10 bg-card/10 backdrop-blur-xl p-0.5 rounded-[2rem] overflow-hidden group transition-liquid active-bounce cursor-pointer",
    className,
  );

  if (onClick) {
    return (
      <div onClick={onClick} className={cardClasses}>
        {Content}
      </div>
    );
  }

  return (
    <Link href={href || "#"} className={cardClasses}>
      {Content}
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

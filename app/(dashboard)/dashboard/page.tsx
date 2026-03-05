"use client";
import { useState } from "react";
import { TopBar } from "@/components/layout/topbar";
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
  Package,
  Hammer,
  DollarSign,
  FileText,
  FileSearch,
  TrendingUp,
  ArrowRight,
  Plus,
  Users,
} from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { useProfile } from "@/lib/hooks/use-profile";
import { cn, formatCurrency } from "@/lib/utils";
import { RepairStatusModal } from "./repair-status-modal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const router = useRouter();
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);

  const { data: profile } = useProfile();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Could not fetch dashboard data");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse-fast">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center">
        <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
          <CardHeader>
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
            <CardTitle className="text-destructive">เกิดข้อผิดพลาด</CardTitle>
            <CardDescription>{error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              ลองใหม่อีกครั้ง
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats, listData, customerName, activeRepairs = [], revenueChart = [] } = data;
  const isCustomer = Array.isArray(data.activeRepairs);

  return (
    <div className="animate-fluid pb-20 max-w-7xl mx-auto">
      <TopBar title="แดชบอร์ด" subtitle={`สวัสดีคุณ ${customerName}`} />

      <div className="px-6 space-y-8 mt-4">
        {/* Metric Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="การจองที่รอยืนยัน"
            value={stats.confirmedBookings}
            description="รายการที่รอการตรวจสอบ"
            icon={Calendar}
            color="text-indigo-500"
            delay="delay-0"
          />
          <StatCard
            title="งานซ่อมที่กำลังดำเนินการ"
            value={stats.activeRepairs}
            description="ช่างกำลังลงมือซ่อม"
            icon={Wrench}
            color="text-amber-500"
            delay="delay-75"
          />
          <StatCard
            title={isCustomer ? "รอชำระเงิน" : "อะไหล่ในคลัง"}
            value={isCustomer ? stats.pendingPayments : stats.inventory}
            description={isCustomer ? "ยอดค้างชำระทั้งหมด" : "จำนวนรายการอะไหล่"}
            icon={isCustomer ? CreditCard : Package}
            color={isCustomer ? "text-rose-500" : "text-cyan-500"}
            alert={isCustomer && stats.pendingPayments > 0}
            delay="delay-150"
          />
          <StatCard
            title={isCustomer ? "คะแนนสะสม" : "รายได้ทั้งหมด"}
            value={isCustomer ? stats?.loyaltyPoints || 0 : formatCurrency(stats?.totalRevenue || 0)}
            description="คำนวณแบบเรียลไทม์"
            icon={isCustomer ? Star : DollarSign}
            color="text-emerald-500"
            delay="delay-200"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Revenue Trends (Staff & Admin) */}
            {!isCustomer && revenueChart.length > 0 && (
              <Card className="border-none shadow-premium bg-card/60 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 delay-150">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <TrendingUp className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">แนวโน้มรายได้</CardTitle>
                      <CardDescription className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-0.5">
                        ผลประกอบการ 7 วันล่าสุด
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-black tracking-widest uppercase py-1 border-muted-foreground/10 bg-muted/20"
                  >
                    REAL-TIME DATA
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end gap-3 px-2 pt-4">
                    {(() => {
                      const max = Math.max(...revenueChart.map((d: any) => d.amount), 1);
                      return revenueChart.map((d: any, i: number) => {
                        const height = (d.amount / max) * 100;
                        return (
                          <div key={i} className="group relative flex-1 flex flex-col items-center gap-3">
                            <div className="absolute -top-12 scale-0 group-hover:scale-100 transition-all duration-300 bg-emerald-600 text-white font-black text-[10px] px-3 py-2 rounded-xl z-10 shadow-xl shadow-emerald-500/20 pointer-events-none">
                              {formatCurrency(d.amount)}
                            </div>
                            <div
                              className="w-full bg-emerald-500/10 group-hover:bg-emerald-500/40 rounded-t-xl transition-all duration-700 ease-out border-x border-t border-transparent group-hover:border-emerald-500/20"
                              style={{ height: `${height}%` }}
                            >
                              <div className="w-full h-full bg-linear-to-t from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
                            </div>
                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase truncate w-full text-center group-hover:text-emerald-600 transition-colors">
                              {d.date}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Repairs Section */}
            {isCustomer && activeRepairs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 px-1">งานซ่อมที่กำลังดำเนินการ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeRepairs.map((rj: any, idx: number) => (
                    <div
                      key={rj.id}
                      className="p-6 rounded-3xl bg-card/60 backdrop-blur-sm shadow-premium hover:bg-primary/5 transition-premium group animate-in fade-in slide-in-from-bottom-2 duration-200 cursor-pointer"
                      style={{ animationDelay: `${idx * 50}ms` }}
                      onClick={() => setSelectedRepairId(rj.id)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-premium">
                            <Bike className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-sm truncate group-hover:text-primary transition-colors">
                              {rj.booking.motorcycle.model}
                            </p>
                            <p className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-widest">
                              {rj.booking.motorcycle.license_plate}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] h-6 px-2.5 font-black border-primary/20 bg-primary/5 text-primary">
                          {rj.progress}%
                        </Badge>
                      </div>
                      <Progress value={rj.progress} className="h-2 rounded-full overflow-hidden bg-muted/50 shadow-inner" />
                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                          {rj.status === "in_progress" ? "กำลังซ่อม" : rj.status === "completed" ? "ซ่อมเสร็จแล้ว" : "รอการประเมิน"}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all pb-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List Data Section (Table) */}
            <Card className="border-none shadow-premium bg-card/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 delay-150">
              <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none">
                    {isCustomer ? "ประวัติการจองล่าสุด" : "คิวที่รอการตรวจสอบ"}
                  </CardTitle>
                  <p className="text-[10px] font-bold text-muted-foreground/30 uppercase mt-1.5 tracking-widest">อัปเดตสถานะแบบเรียลไทม์</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-10 rounded-xl px-4 text-[11px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/5 transition-premium active:scale-95"
                >
                  <Link href={isCustomer ? "/bookings" : "/admin"}>
                    จัดการทั้งหมด <ArrowRight className="w-3 h-3 ml-2" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30 border-none">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="text-[9px] font-black uppercase tracking-[0.2em] h-12 pl-8">ข้อมูลผู้จอง / ยานพาหนะ</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-[0.2em] h-12">วันนัดหมาย</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-[0.2em] h-12">สถานะปัจจุบัน</TableHead>
                      <TableHead className="w-[80px] h-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listData.map((item: any, idx: number) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-muted/40 cursor-pointer group border-none transition-colors duration-300"
                        onClick={() => router.push(isCustomer ? "/bookings" : "/admin")}
                      >
                        <TableCell className="py-5 pl-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-premium">
                              <Bike className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-sm tracking-tight truncate leading-tight group-hover:text-primary transition-colors">
                                {isCustomer ? `${item.motorcycle?.brand} ${item.motorcycle?.model}` : item.customer?.full_name}
                              </p>
                              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">
                                {item.motorcycle?.license_plate || "ไม่ระบุทะเบียน"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-xs font-black text-foreground/80">
                              {format(new Date(item.booking_time), "dd MMMM", {
                                locale: th,
                              })}
                            </p>
                            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">
                              {format(new Date(item.booking_time), "HH:mm")} น.
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[8px] font-black uppercase tracking-[0.15em] px-3 py-1 border-none shadow-sm",
                              item.status === "pending" && "bg-amber-500/15 text-amber-600",
                              item.status === "confirmed" && "bg-sky-500/15 text-sky-600",
                              item.status === "cancelled" && "bg-rose-500/15 text-rose-600",
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full mr-2",
                                item.status === "pending" && "bg-amber-500 animate-pulse",
                                item.status === "confirmed" && "bg-sky-500",
                                item.status === "cancelled" && "bg-rose-500",
                              )}
                            />
                            {item.status === "pending"
                              ? "รอเจ้าหน้าที่ยืนยัน"
                              : item.status === "confirmed"
                                ? "ยืนยันคิวแล้ว"
                                : item.status === "cancelled"
                                  ? "ยกเลิกคิวแล้ว"
                                  : item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="w-8 h-8 rounded-lg bg-muted/0 group-hover:bg-muted/80 flex items-center justify-center transition-premium active:scale-90">
                            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {listData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-60 text-center">
                          <div className="flex flex-col items-center gap-3 opacity-20">
                            <Clock className="w-10 h-10" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">ไม่มีรายการที่รอดำเนินการ</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar / Quick Actions */}
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">เมนูทางลัด</h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickAction icon={Calendar} label="จองซ่อม" href={isCustomer ? "/bookings" : "/admin"} />
                <QuickAction icon={Bike} label="รถของฉัน" href="/motorcycles" />
                {isCustomer && (
                  <>
                    <QuickAction icon={FileText} label="ใบประเมิน" href="/estimates" badge={stats.pendingEstimates} />
                    <QuickAction icon={FileSearch} label="ใบเสนอราคา" href="/quotations" badge={stats.pendingQuotations} />
                  </>
                )}
                <QuickAction icon={CreditCard} label="ชำระเงิน" href="/payments" badge={isCustomer ? stats.pendingPayments : undefined} />
                <QuickAction
                  icon={isCustomer ? Star : Users}
                  label={isCustomer ? "คะแนนสะสม" : "ผู้ใช้งาน"}
                  href={isCustomer ? "/points" : "/users"}
                />
              </div>
            </div>

            {/* Promotion / Announcement Card */}
            <Card className="bg-primary text-primary-foreground border-none shadow-lg shadow-primary/20 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Star className="w-24 h-24 rotate-12" />
              </div>
              <CardHeader className="relative pb-2">
                <Badge variant="secondary" className="w-fit mb-2 bg-white/20 text-white border-none hover:bg-white/30 backdrop-blur-sm">
                  โปรโมชั่นพิเศษ
                </Badge>
                <CardTitle className="text-xl font-black">สิทธิพิเศษระดับพรีเมียม</CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-6 pt-0">
                <p className="text-xs font-medium text-white/80 leading-relaxed">
                  สะสมแต้มทุกครั้งที่ใช้บริการเพื่อรับส่วนลดสูงสุด 50% หรือแลกอะไหล่ฟรี!
                </p>
                <Button variant="secondary" className="w-full font-bold h-11 bg-white text-primary hover:bg-white/90" asChild>
                  <Link href="/points">เริ่มต้นสะสมแต้ม</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <RepairStatusModal repairId={selectedRepairId} onClose={() => setSelectedRepairId(null)} />
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon, color, delay }: any) {
  return (
    <Card
      className={cn(
        "border border-white/5 shadow-premium bg-card/40 backdrop-blur-md transition-premium hover:-translate-y-1 overflow-hidden group animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-4xl",
        delay,
      )}
    >
      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 leading-none">{title}</p>
              <p
                className={cn(
                  "text-3xl font-black tracking-tighter leading-none group-hover:text-primary transition-colors",
                  color.replace("text-", "text-opacity-80 text-"),
                )}
              >
                {value}
              </p>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest leading-none">{description}</p>
          </div>
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center bg-muted/20 border border-muted-foreground/5 shadow-inner transition-premium group-hover:scale-105",
              color.replace("text-", "text-"),
            )}
          >
            <Icon className="w-7 h-7 font-black opacity-80" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon: Icon, label, href, badge }: any) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-6 rounded-4xl border border-white/5 bg-card/40 backdrop-blur-md hover:bg-primary/5 transition-premium active:scale-95 group shadow-premium hover:-translate-y-0.5 animate-in fade-in zoom-in-95 duration-300"
    >
      {badge > 0 && (
        <Badge className="absolute top-4 right-4 h-5 min-w-5 px-1 bg-primary text-primary-foreground font-black text-[9px] rounded-full z-10 border-none shadow-md">
          {badge}
        </Badge>
      )}
      <div className="p-4 rounded-2xl bg-muted/40 group-hover:bg-primary/10 transition-premium mb-4 text-muted-foreground group-hover:text-primary">
        <Icon className="w-7 h-7 transition-premium group-hover:scale-110" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 group-hover:text-primary transition-colors text-center line-clamp-1 px-1">
        {label}
      </span>
    </Link>
  );
}

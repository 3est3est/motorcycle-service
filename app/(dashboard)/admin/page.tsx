"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import {
  Calendar,
  Bike,
  User,
  Check,
  X,
  Loader2,
  CalendarCheck,
  TrendingUp,
  Wrench,
  CircleDollarSign,
  AlertCircle,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch Bookings with TanStack Query
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: async () => {
      const res = await fetch("/api/staff/bookings");
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
  });

  // Fetch Repairs with TanStack Query
  const { data: repairs = [], isLoading: isLoadingRepairs } = useQuery({
    queryKey: ["admin", "repairs"],
    queryFn: async () => {
      const res = await fetch("/api/staff/repairs");
      if (!res.ok) throw new Error("Failed to fetch repairs");
      return res.json();
    },
  });

  const stats = {
    pendingBookings: bookings.filter((b: any) => b.status === "pending").length,
    activeRepairs: repairs.filter((r: any) => r.status === "in_progress").length,
  };

  const handleAction = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/staff/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["admin"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      }
    } catch (err) {
      console.error("เชื่อมต่อเซิร์ฟเวอร์ผิดพลาด", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const loading = isLoadingBookings || isLoadingRepairs;

  if (loading && bookings.length === 0) {
    return (
      <div className="p-6 space-y-8 animate-pulse">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[600px] rounded-2xl" />
          <Skeleton className="h-[600px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fluid pb-20 max-w-7xl mx-auto">
      <TopBar title="จัดการระบบร้าน" subtitle="ภาพรวมการทำงานและรายการคิวจองที่รอดำเนินการ" />

      <div className="px-6 space-y-10">
        {/* Admin Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <OverviewCard
            title="จองคิวใหม่"
            value={stats.pendingBookings}
            icon={CalendarCheck}
            color="text-sky-500"
            description="รายการที่รอยืนยันคิว"
            delay="delay-0"
          />
          <OverviewCard
            title="กำลังซ่อม"
            value={stats.activeRepairs}
            icon={Wrench}
            color="text-amber-500"
            description="งานที่ช่างกำลังดำเนินการ"
            delay="delay-75"
          />
          <OverviewCard
            title="สถานะร้าน"
            value="เปิดทำการ"
            icon={TrendingUp}
            color="text-emerald-500"
            description="อัปเดตระบบเรียลไทม์"
            delay="delay-150"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List: Incoming Bookings */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">คำขอจองคิวในระบบ</h3>

            {bookings.filter((b: any) => b.status === "pending").length === 0 ? (
              <Card className="shadow-none bg-muted/20 py-24 text-center rounded-4xl border-dashed">
                <div className="w-16 h-16 rounded-full bg-background border flex items-center justify-center mx-auto mb-6 opacity-40">
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-sm font-bold opacity-30 uppercase tracking-[0.25em]">เคลียร์รายชื่อคิวจองครบแล้ว</p>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="space-y-4">
                  {bookings
                    .filter((b: any) => b.status === "pending")
                    .map((b: any, idx: number) => (
                      <Card
                        key={b.id}
                        className="border-none shadow-premium hover:shadow-2xl transition-premium overflow-hidden bg-card/60 backdrop-blur-sm group animate-in fade-in slide-in-from-left-4 duration-700"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <CardContent className="p-0">
                          <div className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground shrink-0 border border-muted-foreground/5 shadow-inner group-hover:bg-primary/10 group-hover:text-primary transition-premium group-hover:scale-110 group-hover:rotate-3">
                                <Calendar className="w-8 h-8" />
                              </div>
                              <div className="space-y-2">
                                <p className="font-black text-2xl tracking-tighter uppercase text-foreground group-hover:text-primary transition-colors">
                                  {format(new Date(b.booking_time), "dd MMMM, HH:mm น.", { locale: th })}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                  <span className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg">
                                    <Bike className="w-4 h-4 text-primary" /> {b.motorcycle.brand} {b.motorcycle.model}{" "}
                                    <span className="text-foreground/40 px-1">|</span>{" "}
                                    <span className="text-primary font-black">{b.motorcycle.license_plate}</span>
                                  </span>
                                  <span className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg">
                                    <User className="w-4 h-4 text-emerald-500" /> {b.customer.full_name}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-3 shrink-0">
                              <Button
                                variant="ghost"
                                className="h-14 px-8 rounded-2xl font-black uppercase text-[11px] tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 active:scale-95 transition-premium"
                                onClick={() => handleAction(b.id, "cancelled")}
                                disabled={updatingId === b.id}
                              >
                                {updatingId === b.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <X className="w-4 h-4" /> ปฏิเสธ
                                  </div>
                                )}
                              </Button>
                              <Button
                                className="h-14 px-10 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95 transition-premium"
                                onClick={() => handleAction(b.id, "confirmed")}
                                disabled={updatingId === b.id}
                              >
                                {updatingId === b.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4" /> ยืนยันคิว
                                  </div>
                                )}
                              </Button>
                            </div>
                          </div>
                          {b.symptom_note && (
                            <div className="px-8 py-5 bg-muted/20 border-t border-muted-foreground/5 flex items-start gap-4">
                              <div className="p-1.5 rounded-lg bg-background shadow-sm mt-0.5">
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">อาการเบื้องต้น</p>
                                <p className="text-xs text-muted-foreground leading-relaxed font-bold italic">“{b.symptom_note}”</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Recent History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ดำเนินการล่าสุด</h3>
              <History className="w-4 h-4 text-muted-foreground/30" />
            </div>

            <Card className="border-none shadow-sm h-fit">
              <CardContent className="p-0">
                <ScrollArea className="h-[550px]">
                  <div className="divide-y">
                    {bookings
                      .filter((b: any) => b.status !== "pending")
                      .slice(0, 15)
                      .map((b: any) => (
                        <div key={b.id} className="p-5 flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm tracking-tight truncate">{b.customer.full_name}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 mt-0.5">
                              {b.motorcycle.license_plate} • {format(new Date(b.booking_time), "d MMM")}
                            </p>
                          </div>
                          <Badge
                            variant={b.status === "confirmed" ? "default" : "outline"}
                            className={cn(
                              "text-[8px] font-black uppercase px-3 py-1 h-6 border-none rounded-full",
                              b.status === "confirmed"
                                ? "bg-sky-500/15 text-sky-600 hover:bg-sky-500/25"
                                : "bg-rose-500/15 text-rose-600 hover:bg-rose-500/25",
                            )}
                          >
                            {b.status === "confirmed" ? "ยืนยันแล้ว" : "ยกเลิกแล้ว"}
                          </Badge>
                        </div>
                      ))}
                    {bookings.filter((b: any) => b.status !== "pending").length === 0 && (
                      <div className="p-10 text-center text-xs font-medium text-muted-foreground italic">ไม่มีประวัติล่าสุด</div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewCard({ title, value, icon: Icon, color, description, delay }: any) {
  return (
    <Card
      className={cn(
        "border border-border/50 shadow-sm bg-card hover:bg-accent/5 transition-all overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-700 rounded-3xl",
        delay,
      )}
    >
      <CardContent className="p-6 flex items-center justify-between gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{title}</p>
          <p className={cn("text-3xl font-bold tracking-tight", color)}>{value}</p>
          <p className="text-[10px] font-medium text-muted-foreground/40">{description}</p>
        </div>
        <div className={cn("p-4 rounded-2xl bg-muted/50 group-hover:scale-110 transition-transform", color)}>
          <Icon className="w-6 h-6 opacity-80" strokeWidth={2.5} />
        </div>
      </CardContent>
    </Card>
  );
}

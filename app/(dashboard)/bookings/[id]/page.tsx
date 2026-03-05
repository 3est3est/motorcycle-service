"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/topbar";
import {
  Bike,
  Calendar,
  Clock,
  ChevronLeft,
  Loader2,
  AlertCircle,
  ClipboardList,
  Wrench,
  CheckCircle2,
  Package,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const {
    data: booking,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/${id}`);
      if (!res.ok) throw new Error("Could not fetch booking details");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary/20" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tight">ไม่พบข้อมูลการจอง</h3>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
            The booking record could not be found or you don't have access.
          </p>
        </div>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="rounded-xl px-10 font-bold uppercase tracking-widest text-xs h-12"
        >
          กลับสู่หน้าเดิม
        </Button>
      </div>
    );
  }

  const bDate = new Date(booking.booking_time);
  const statusLabels: any = {
    pending: { label: "รอยืนยัน", color: "bg-amber-500/10 text-amber-600" },
    confirmed: { label: "ยืนยันแล้ว", color: "bg-emerald-500/10 text-emerald-600" },
    cancelled: { label: "ยกเลิก", color: "bg-rose-500/10 text-rose-600" },
    completed: { label: "เสร็จสิ้น", color: "bg-blue-500/10 text-blue-600" },
  };
  const currentStatus = statusLabels[booking.status] || statusLabels.pending;

  return (
    <div className="animate-fluid pb-20 max-w-5xl mx-auto">
      <TopBar title="รายละเอียดการจอง" subtitle={`Booking Ref: #BK-${booking.id.slice(-6).toUpperCase()}`} backButton />

      <div className="px-6 space-y-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-4xl border-none shadow-premium bg-card/60 backdrop-blur-md overflow-hidden">
              <div className="p-10 space-y-10">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                  <div className="space-y-4">
                    <Badge
                      className={cn(
                        "rounded-full px-4 py-1 font-black uppercase tracking-widest text-[10px] border-none shadow-sm",
                        currentStatus.color,
                      )}
                    >
                      {currentStatus.label}
                    </Badge>
                    <h2 className="text-4xl font-black tracking-tighter uppercase leading-tight">
                      {booking.motorcycle.brand} {booking.motorcycle.model}
                    </h2>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-40">
                      {booking.motorcycle.license_plate}
                    </p>
                  </div>
                  <div className="p-6 rounded-3xl bg-muted/30 border flex flex-col items-center gap-1 min-w-[120px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">คิวเวลา</span>
                    <span className="text-3xl font-black tracking-tighter">{format(bDate, "HH:mm")}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">น. (ICT)</span>
                  </div>
                </div>

                <Separator className="opacity-40" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-primary/60">
                      <Calendar className="w-5 h-5" />
                      <span className="text-[11px] font-black uppercase tracking-widest">วันที่รับบริการ</span>
                    </div>
                    <p className="text-xl font-black uppercase tracking-tight">{format(bDate, "dd MMMM yyyy", { locale: th })}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-primary/60">
                      <ClipboardList className="w-5 h-5" />
                      <span className="text-[11px] font-black uppercase tracking-widest">บันทึกอาการ</span>
                    </div>
                    <p className="text-sm font-bold leading-relaxed text-foreground/80 bg-muted/10 p-4 rounded-2xl italic">
                      "{booking.symptom_note || "ไม่มีบันทึกอาการเพิ่มเติม"}"
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {booking.repair_job && (
              <Card className="rounded-4xl border-none shadow-premium bg-emerald-500/5 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                <CardHeader className="bg-emerald-500/10 p-8 border-b border-emerald-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-black uppercase tracking-widest text-emerald-700">ความคืบหน้างานซ่อม</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60 mt-1">
                        Repair Job Status & Progress
                      </CardDescription>
                    </div>
                    <Wrench className="w-8 h-8 text-emerald-600/40" />
                  </div>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">สถานะงานซ่อม</p>
                        <p className="text-2xl font-black uppercase tracking-tight text-emerald-700">
                          {booking.repair_job.status === "pending"
                            ? "กำลังรอช่างรับงาน"
                            : booking.repair_job.status === "in_progress"
                              ? "กำลังดำเนินการซ่อม"
                              : booking.repair_job.status === "completed"
                                ? "ซ่อมเสร็จสิ้นแล้ว"
                                : booking.repair_job.status}
                        </p>
                      </div>
                    </div>
                    {booking.repair_job.staff && (
                      <div className="text-center sm:text-right space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">ช่างผู้ดูแล</p>
                        <p className="text-lg font-black">{booking.repair_job.staff.full_name}</p>
                      </div>
                    )}
                  </div>

                  {booking.repair_job.repair_parts && booking.repair_job.repair_parts.length > 0 && (
                    <div className="space-y-6 pt-8 border-t border-emerald-500/10">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-emerald-600/60" />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">รายการอะไหล่และค่าแรง</h4>
                      </div>
                      <div className="space-y-3">
                        {booking.repair_job.repair_parts.map((p: any) => (
                          <div key={p.id} className="flex justify-between items-center p-4 rounded-2xl bg-white/40 dark:bg-black/20">
                            <div>
                              <p className="font-bold text-sm">{p.part.name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                จำนวน {p.quantity} {p.part.unit || "ชิ้น"}
                              </p>
                            </div>
                            <p className="font-black text-emerald-700">{formatCurrency(Number(p.part.price) * p.quantity)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar / Profile Info */}
          <div className="space-y-8">
            <Card className="rounded-4xl border-none shadow-premium bg-primary/5 p-8 space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">ข้อมูลผู้จอง</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-lg">
                    {booking.customer.full_name[0]}
                  </div>
                  <div>
                    <p className="font-black">{booking.customer.full_name}</p>
                    <p className="text-[10px] font-bold opacity-40">{booking.customer.phone}</p>
                  </div>
                </div>
              </div>
              <Separator className="opacity-20" />
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">รหัสการจอง</span>
                  <span className="font-black uppercase tracking-tighter text-sm">#BK-{booking.id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">วันที่ทำรายการ</span>
                  <span className="font-bold text-[11px] uppercase tracking-wide">
                    {format(new Date(booking.created_at), "dd/MM/yyyy HH:mm", { locale: th })}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="rounded-4xl border-none shadow-premium bg-card/60 p-8 flex flex-col items-center text-center space-y-6 border border-white/5">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest">นัดหมายสำคัญ</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed opacity-60">
                  กรุณามารับบริการก่อนเวลา 15 นาที หากมาช้าเกิน 30 นาที คิวอาจถูกยกเลิกอัตโนมัติ
                </p>
              </div>
              <Button asChild variant="link" className="text-amber-600 font-black uppercase text-[10px] tracking-[0.2em] h-auto p-0">
                <a href="tel:089364785">ติดต่อเจ้าหน้าที่</a>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

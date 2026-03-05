"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { Wrench, Bike, User, Clock, CheckCircle2, Loader2, ChevronRight, Settings2, Package, UserCheck, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RepairDetailModal } from "./repair-detail-modal";
import { ExportPDFButton } from "@/components/pdf/export-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const repairStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  created: {
    label: "รอการประเมิน",
    color: "bg-amber-500/15 text-amber-600",
    icon: Clock,
  },
  in_progress: {
    label: "กำลังดำเนินการ",
    color: "bg-sky-500/15 text-sky-600",
    icon: Settings2,
  },
  completed: {
    label: "ซ่อมเสร็จแล้ว",
    color: "bg-emerald-500/15 text-emerald-600",
    icon: CheckCircle2,
  },
  delivered: {
    label: "ส่งมอบสำเร็จ",
    color: "bg-indigo-500/15 text-indigo-600",
    icon: Package,
  },
};

export default function RepairJobsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ["repairs"],
    queryFn: async () => {
      const res = await fetch("/api/staff/repairs");
      if (!res.ok) throw new Error("Failed to fetch repairs");
      return res.json();
    },
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-users"],
    queryFn: async () => {
      const res = await fetch("/api/staff/users");
      if (!res.ok) throw new Error("Failed to fetch staff");
      const allUsers = await res.json();
      return allUsers.filter((u: any) => u.role === "staff" || u.role === "admin");
    },
  });

  const getStaffName = (id: string) => {
    const staff = staffList.find((s: any) => s.id === id);
    return staff?.full_name || "ยังไม่ได้ระบุช่าง";
  };

  const filteredRepairs = repairs.filter((r: any) => {
    if (activeTab === "current") {
      return ["created", "in_progress", "completed"].includes(r.status);
    }
    return r.status === "delivered";
  });

  const updateStatus = async (id: string, status: string, progress?: number) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/staff/repairs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, progress }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["repairs"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        toast.success(`อัปเดตสถานะงานซ่อมเรียบร้อยแล้ว`);
      }
    } catch (err) {
      toast.error("อัปเดตไม่สำเร็จ");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="animate-fluid pb-20 max-w-7xl mx-auto">
      <TopBar title="จัดการงานซ่อม" subtitle="ภาพรวมการซ่อม ประเมินอะไหล่ และติดตามความคืบหน้า" />

      <div className="px-6 space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-tight">รายการงานซ่อม ({filteredRepairs.length})</h3>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">ระบบติดตามสถานะงานซ่อมแบบเรียลไทม์</p>
          </div>

          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2 h-11 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="current" className="rounded-lg font-bold text-xs uppercase tracking-widest">
                งานปัจจุบัน
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg font-bold text-xs uppercase tracking-widest">
                ประวัติส่งมอบ
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-3xl" />
              ))}
            </div>
          ) : filteredRepairs.length === 0 ? (
            <div className="py-24 text-center border bg-muted/10 rounded-4xl border-dashed flex flex-col items-center gap-8">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center opacity-20">
                <Wrench className="w-10 h-10" />
              </div>
              <p className="text-sm font-bold opacity-30 uppercase tracking-[0.25em]">
                {activeTab === "current" ? "ไม่มีงานซ่อมรอการดำเนินการ" : "ยังไม่มีประวัติการส่งมอบรถ"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredRepairs.map((rj: any, idx: number) => {
                const cfg = repairStatusConfig[rj.status] || repairStatusConfig.created;
                const Icon = cfg.icon;
                return (
                  <Card
                    key={rj.id}
                    className="border-none shadow-premium hover:shadow-2xl transition-premium overflow-hidden bg-card/60 backdrop-blur-sm group animate-in fade-in slide-in-from-bottom-4 duration-700"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <CardContent className="p-0">
                      <div className="p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                        <div className="flex items-start gap-8 min-w-0 flex-1">
                          <div
                            className={cn(
                              "w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 border transition-premium shadow-lg group-hover:scale-110 group-hover:rotate-3",
                              rj.status === "in_progress"
                                ? "bg-primary text-primary-foreground border-primary/50 shadow-primary/20"
                                : cfg.color + " border-current/5",
                            )}
                          >
                            <Icon className="w-10 h-10" />
                          </div>
                          <div className="space-y-5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-4">
                              <h4 className="font-black text-2xl tracking-tighter uppercase group-hover:text-primary transition-colors">
                                #{rj.id.slice(-8).toUpperCase()}
                              </h4>
                              <div className="flex gap-2">
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 border-none rounded-full shadow-sm",
                                    cfg.color,
                                  )}
                                >
                                  {cfg.label}
                                </Badge>
                                {rj.customer_confirmed && (
                                  <Badge
                                    variant="default"
                                    className="bg-emerald-500 text-white animate-pulse text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/20"
                                  >
                                    ลูกค้าอนุมัติแล้ว
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                              <span className="flex items-center gap-2.5 bg-muted/30 px-3 py-1.5 rounded-xl group-hover:text-primary transition-colors">
                                <Bike className="w-4.5 h-4.5 text-primary" strokeWidth={2.5} /> {rj.booking.motorcycle.brand}{" "}
                                {rj.booking.motorcycle.model} <span className="opacity-20">|</span>{" "}
                                <span className="text-primary">{rj.booking.motorcycle.license_plate}</span>
                              </span>
                              <span className="flex items-center gap-2.5 bg-muted/30 px-3 py-1.5 rounded-xl">
                                <User className="w-4.5 h-4.5 text-muted-foreground/40" /> {rj.booking.customer.full_name}
                              </span>
                              <span className="flex items-center gap-2.5 px-4 py-2 bg-primary/5 rounded-xl text-primary transition-premium group-hover:bg-primary/10 border border-primary/5">
                                <UserCheck className="w-4 h-4" />
                                <p className="opacity-60">ช่างเทคนิค:</p>{" "}
                                <span className="font-black text-foreground">{getStaffName(rj.assigned_staff_id)}</span>
                              </span>
                            </div>

                            {/* Timeline display on card */}
                            {(rj.start_date || rj.end_date) && (
                              <div className="flex flex-wrap items-center gap-6 pt-2">
                                {rj.start_date && (
                                  <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                    <div className="flex flex-col gap-0.5">
                                      <p className="text-[8px] font-black opacity-30 tracking-widest uppercase">วันที่เริ่มซ่อม</p>
                                      <p className="text-[10px] font-black text-foreground/70 uppercase">
                                        {format(new Date(rj.start_date), "dd MMM, HH:mm น.", { locale: th })}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {rj.end_date && (
                                  <div className="flex items-center gap-3 border-l pl-6 border-muted">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <div className="flex flex-col gap-0.5">
                                      <p className="text-[8px] font-black opacity-30 tracking-widest uppercase">เสร็จสมบูรณ์เมื่อ</p>
                                      <p className="text-[10px] font-black text-emerald-600 uppercase">
                                        {format(new Date(rj.end_date), "dd MMM, HH:mm น.", { locale: th })}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col xl:flex-row items-center gap-10 lg:gap-12 w-full lg:w-auto">
                          <div className="w-full xl:w-64 space-y-4">
                            <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-[0.2em] px-0.5">
                              <span className="text-muted-foreground/40 pb-0.5">ความคืบหน้า</span>
                              <span className="text-primary text-xl tracking-tight">{rj.progress}%</span>
                            </div>
                            <Progress value={rj.progress} className="h-3 bg-muted/50 overflow-hidden rounded-full font-bold shadow-inner" />
                          </div>

                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            {(rj.status === "completed" || rj.status === "delivered") && (
                              <div className="hidden sm:block">
                                <ExportPDFButton
                                  type="REPORT"
                                  job={rj}
                                  items={
                                    rj.repair_parts?.map((pj: any) => ({
                                      part: pj.part,
                                      quantity: pj.quantity,
                                      unit_price: pj.unit_price || pj.part?.price,
                                      price_total: pj.price_total,
                                    })) || []
                                  }
                                />
                              </div>
                            )}
                            {rj.status === "created" && (
                              <Button
                                className="h-16 flex-1 sm:flex-none sm:min-w-[160px] rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] bg-primary text-primary-foreground shadow-2xl shadow-primary/20 active:scale-95 transition-premium"
                                onClick={() => updateStatus(rj.id, "in_progress", 10)}
                                disabled={updatingId === rj.id}
                              >
                                {updatingId === rj.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <div className="flex items-center gap-2.5">
                                    <Wrench className="w-4 h-4" /> รับงานซ่อม
                                  </div>
                                )}
                              </Button>
                            )}
                            {rj.status === "in_progress" && (
                              <Button
                                className="h-16 flex-1 sm:flex-none sm:min-w-[160px] rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl shadow-emerald-500/20 active:scale-95 transition-premium"
                                onClick={() => updateStatus(rj.id, "completed", 100)}
                                disabled={updatingId === rj.id}
                              >
                                {updatingId === rj.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <div className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4" /> ปิดงานซ่อม
                                  </div>
                                )}
                              </Button>
                            )}
                            {rj.status === "completed" && (
                              <Button
                                variant="outline"
                                className="h-16 flex-1 sm:flex-none sm:min-w-[160px] rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] border-none bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 transition-premium shadow-lg shadow-indigo-500/5 active:scale-95"
                                onClick={() => updateStatus(rj.id, "delivered")}
                                disabled={updatingId === rj.id}
                              >
                                {updatingId === rj.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <div className="flex items-center gap-2.5">
                                    <Package className="w-4 h-4" /> ส่งมอบรถ
                                  </div>
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-16 w-16 rounded-2xl bg-muted/40 hover:bg-muted/60 transition-premium active:scale-90 shadow-inner"
                              onClick={() => setSelectedJob(rj)}
                            >
                              <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <RepairDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}

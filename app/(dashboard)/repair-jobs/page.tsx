"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  Bike,
  User,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Settings2,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RepairDetailModal } from "./repair-detail-modal";

const repairStatusConfig: Record<
  string,
  { label: string; variant: any; icon: any }
> = {
  created: { label: "รอซ่อม/เสนอราคา", variant: "warning", icon: Clock },
  in_progress: { label: "กำลังซ่อม", variant: "confirmed", icon: Settings2 },
  completed: {
    label: "ซ่อมเสร็จสิ้น",
    variant: "completed",
    icon: CheckCircle2,
  },
  delivered: { label: "ส่งมอบแล้ว", variant: "outline", icon: Package },
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
    refetchInterval: 5000,
  });

  const filteredRepairs = repairs.filter((r: any) => {
    if (activeTab === "current") {
      return ["created", "in_progress", "completed"].includes(r.status);
    }
    return r.status === "delivered";
  });

  const updateStatus = async (
    id: string,
    status: string,
    progress?: number,
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/staff/repairs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, progress }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["repairs"] });
      }
    } catch (err) {
      alert("อัปเดตไม่สำเร็จ");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      <TopBar
        title="จัดการงานซ่อม"
        subtitle="ประเมินราคา ลงรายการอะไหล่ และติดตามความคืบหน้างานซ่อม"
      />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
            รายการงานซ่อม ({filteredRepairs.length})
          </h3>
          <div className="flex bg-muted/50 p-1.5 rounded-2xl w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 sm:flex-none h-9 rounded-xl px-6 text-xs font-bold transition-all",
                activeTab === "current"
                  ? "bg-background shadow-md"
                  : "text-muted-foreground",
              )}
              onClick={() => setActiveTab("current")}
            >
              งานปัจจุบัน
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 sm:flex-none h-9 rounded-xl px-6 text-xs font-bold transition-all",
                activeTab === "history"
                  ? "bg-background shadow-md"
                  : "text-muted-foreground",
              )}
              onClick={() => setActiveTab("history")}
            >
              ประวัติส่งมอบ
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                กำลังโหลดรายการงานซ่อม...
              </p>
            </div>
          ) : filteredRepairs.length === 0 ? (
            <div className="py-20 text-center bg-muted/20 border-2 border-dashed rounded-[2.5rem]">
              <Wrench className="w-12 h-12 mx-auto mb-3 opacity-10" />
              <p className="text-muted-foreground font-bold italic">
                {activeTab === "current"
                  ? "ยังไม่มีงานซ่อมค้างอยู่"
                  : "ยังไม่มีประวัติการส่งมอบ"}
              </p>
            </div>
          ) : (
            filteredRepairs.map((rj: any) => {
              const cfg =
                repairStatusConfig[rj.status] || repairStatusConfig.created;
              const Icon = cfg.icon;
              return (
                <Card
                  key={rj.id}
                  className="group hover:border-primary/50 transition-all shadow-xs overflow-hidden rounded-3xl"
                >
                  <CardContent className="p-0">
                    <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-start gap-5 min-w-0">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ring-1 ring-white/10",
                            rj.status === "in_progress"
                              ? "bg-primary text-white shadow-primary/20"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-3">
                            <h4 className="font-black text-foreground text-lg uppercase tracking-tight">
                              #{rj.id.slice(-8)}
                            </h4>
                            <Badge
                              variant={cfg.variant}
                              className="font-bold uppercase text-[10px]"
                            >
                              {cfg.label}
                            </Badge>
                            {rj.customer_confirmed && (
                              <Badge
                                variant="success"
                                className="font-black uppercase text-[10px] animate-pulse"
                              >
                                ลูกค้าโอเคแล้ว
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-2 font-bold text-foreground/80">
                              <Bike className="w-4 h-4" />
                              {rj.booking.motorcycle.brand}{" "}
                              {rj.booking.motorcycle.model} (
                              {rj.booking.motorcycle.license_plate})
                            </span>
                            <span className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {rj.booking.customer.full_name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-10">
                        <div className="w-full sm:w-56 space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest px-1">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="text-primary">{rj.progress}%</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden p-0.5">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                              style={{ width: `${rj.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          {rj.status === "created" && (
                            <Button
                              size="sm"
                              className="text-xs h-10 px-6 rounded-xl font-bold flex-1 sm:flex-none shadow-md shadow-primary/20"
                              onClick={() =>
                                updateStatus(rj.id, "in_progress", 10)
                              }
                              disabled={updatingId === rj.id}
                            >
                              {updatingId === rj.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "รับงาน/เริ่มซ่อม"
                              )}
                            </Button>
                          )}
                          {rj.status === "in_progress" && (
                            <Button
                              size="sm"
                              variant="success"
                              className="text-xs h-10 px-6 rounded-xl font-bold flex-1 sm:flex-none shadow-lg shadow-success/20"
                              onClick={() =>
                                updateStatus(rj.id, "completed", 100)
                              }
                              disabled={updatingId === rj.id}
                            >
                              {updatingId === rj.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "ซ่อมเสร็จแล้ว"
                              )}
                            </Button>
                          )}
                          {rj.status === "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-10 px-6 rounded-xl font-bold flex-1 sm:flex-none hover:bg-primary/5 hover:text-primary transition-all"
                              onClick={() => updateStatus(rj.id, "delivered")}
                              disabled={updatingId === rj.id}
                            >
                              {updatingId === rj.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "ส่งมอบรถ"
                              )}
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                            onClick={() => setSelectedJob(rj)}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <RepairDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}

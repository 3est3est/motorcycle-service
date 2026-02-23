"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  Bike,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Settings2,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const repairStatusConfig: Record<
  string,
  { label: string; variant: any; icon: any }
> = {
  created: { label: "เตรียมการ", variant: "pending", icon: Clock },
  in_progress: { label: "กำลังซ่อม", variant: "confirmed", icon: Settings2 },
  completed: {
    label: "ซ่อมเสร็จสิ้น",
    variant: "completed",
    icon: CheckCircle2,
  },
  delivered: { label: "ส่งมอบแล้ว", variant: "outline", icon: Package },
};

export default function RepairJobsPage() {
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRepairs = async () => {
    try {
      const res = await fetch("/api/staff/repairs");
      if (res.ok) setRepairs(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, []);

  const updateStatus = async (
    id: string,
    status: string,
    progress?: number,
  ) => {
    try {
      const res = await fetch(`/api/staff/repairs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, progress }),
      });
      if (res.ok) fetchRepairs();
    } catch (err) {
      alert("อัปเดตไม่สำเร็จ");
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      <TopBar
        title="งานซ่อม"
        subtitle="จัดการงานซ่อม อัปเดตสถานะ และส่งมอบรถ (สำหรับเจ้าหน้าที่)"
      />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-foreground">
            รายการงานซ่อมทั้งหมด ({repairs.length})
          </h3>
          <div className="flex bg-muted/50 p-1 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              className="bg-background shadow-xs h-8 rounded-md px-4 text-xs"
            >
              งานปัจจุบัน
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-md px-4 text-xs"
            >
              ประวัติ
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                กำลังโหลดรายการงานซ่อม...
              </p>
            </div>
          ) : repairs.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-2xl">
              <Wrench className="w-12 h-12 mx-auto mb-3 opacity-10" />
              <p className="text-muted-foreground">
                ยังไม่มีรายการงานซ่อมในระบบ
              </p>
            </div>
          ) : (
            repairs.map((rj) => {
              const cfg =
                repairStatusConfig[rj.status] || repairStatusConfig.created;
              const Icon = cfg.icon;
              return (
                <Card
                  key={rj.id}
                  className="group hover:border-primary/30 transition-all overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-start gap-4 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            rj.status === "in_progress"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground truncate uppercase">
                              #{rj.id.slice(-8)}
                            </h4>
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                              <Bike className="w-3.5 h-3.5" />
                              {rj.booking.motorcycle.brand}{" "}
                              {rj.booking.motorcycle.model} (
                              {rj.booking.motorcycle.license_plate})
                            </span>
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              {rj.booking.customer.full_name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-8">
                        <div className="w-full sm:w-48 space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-muted-foreground">
                              ความคืบหน้า
                            </span>
                            <span className="text-primary">{rj.progress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${rj.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                          {rj.status === "created" && (
                            <Button
                              size="sm"
                              className="text-xs h-8"
                              onClick={() =>
                                updateStatus(rj.id, "in_progress", 10)
                              }
                            >
                              เริ่มซ่อม
                            </Button>
                          )}
                          {rj.status === "in_progress" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 border-success text-success hover:bg-success/5"
                              onClick={() =>
                                updateStatus(rj.id, "completed", 100)
                              }
                            >
                              ซ่อมเสร็จ
                            </Button>
                          )}
                          {rj.status === "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8"
                              onClick={() => updateStatus(rj.id, "delivered")}
                            >
                              ส่งมอบ/เรียกชำระ
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
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
    </div>
  );
}

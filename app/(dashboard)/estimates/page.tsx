"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { FileText, Bike, Clock, CheckCircle2, XCircle, Loader2, AlertCircle, ChevronRight, ThumbsUp, ThumbsDown, Info } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface Estimate {
  id: string;
  description: string;
  estimated_cost: number | { toNumber: () => number };
  status?: string;
  created_at: string;
  booking: {
    id: string;
    symptom_note: string | null;
    motorcycle: {
      brand: string;
      model: string;
      license_plate: string;
    };
    repair_job: {
      id: string;
      customer_confirmed: boolean;
      status: string;
    } | null;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: {
    label: "รอยืนยัน",
    color: "bg-amber-500/10 text-amber-600",
    icon: Clock,
  },
  approved: {
    label: "ยืนยันแล้ว",
    color: "bg-emerald-500/10 text-emerald-600",
    icon: CheckCircle2,
  },
  rejected: {
    label: "ปฏิเสธแล้ว",
    color: "bg-rose-500/10 text-rose-600",
    icon: XCircle,
  },
};

export default function EstimatesPage() {
  const queryClient = useQueryClient();
  const [confirmDialog, setConfirmDialog] = useState<{
    id: string;
    action: "confirm" | "reject";
  } | null>(null);

  const { data: estimates = [], isLoading } = useQuery<Estimate[]>({
    queryKey: ["estimates"],
    queryFn: async () => {
      const res = await fetch("/api/estimates");
      if (!res.ok) throw new Error("Could not fetch estimates");
      return res.json();
    },
  });

  const updateEstimate = useMutation({
    mutationFn: async ({ estimateId, action }: { estimateId: string; action: "confirm" | "reject" }) => {
      const res = await fetch(`/api/estimates/${estimateId}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "เกิดข้อผิดพลาดในการดำเนินการ");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(variables.action === "confirm" ? "ยืนยันรับการประเมินเรียบร้อยแล้ว" : "ปฏิเสธการประเมินเรียบร้อยแล้ว");
      setConfirmDialog(null);
    },
    onError: (err: any) => {
      toast.error(err.message);
      setConfirmDialog(null);
    },
  });

  const getCost = (cost: any) => {
    if (typeof cost === "number") return cost;
    if (cost && typeof cost.toNumber === "function") return cost.toNumber();
    const num = Number(cost);
    return isNaN(num) ? 0 : num;
  };

  return (
    <div className="animate-fluid pb-20 max-w-7xl mx-auto">
      <TopBar title="ใบประเมินงานซ่อม" subtitle="ตรวจสอบรายละเอียดการประเมินเบื้องต้นและค่าใช้จ่าย" />

      <div className="px-6 space-y-8 mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight">รายการประเมินทั้งหมด ({estimates.length})</h3>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-[2.5rem]" />
            ))}
          </div>
        ) : estimates.length === 0 ? (
          <div className="py-32 text-center border-none rounded-[3rem] bg-muted/10">
            <FileText className="w-16 h-16 mx-auto mb-6 opacity-5" />
            <p className="text-muted-foreground font-bold uppercase tracking-[0.25em] text-xs opacity-40">ไม่พบรายการประเมินงานซ่อม</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {estimates.map((est) => {
              const status = est.status || "pending";
              const cfg = statusConfig[status] || statusConfig.pending;
              const Icon = cfg.icon;
              const costValue = getCost(est.estimated_cost);

              return (
                <Card
                  key={est.id}
                  className="rounded-[2.5rem] border-none shadow-premium bg-card/50 overflow-hidden group hover:shadow-xl transition-all duration-500"
                >
                  <CardContent className="p-0">
                    <div className="p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                      <div className="flex items-start gap-8 min-w-0 flex-1">
                        <div
                          className={cn(
                            "w-20 h-20 rounded-[1.75rem] flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:scale-110 shadow-inner",
                            cfg.color,
                          )}
                        >
                          <Icon className="w-10 h-10" />
                        </div>
                        <div className="space-y-4 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-4">
                            <h4 className="font-black text-2xl tracking-tighter uppercase whitespace-nowrap">
                              #EST-{est.id.slice(-6).toUpperCase()}
                            </h4>
                            <Badge
                              variant="secondary"
                              className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 border-none", cfg.color)}
                            >
                              {cfg.label}
                            </Badge>
                          </div>

                          <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                              <span className="flex items-center gap-2">
                                <Bike className="w-4 h-4 text-primary" strokeWidth={2.5} /> {est.booking.motorcycle.brand}{" "}
                                {est.booking.motorcycle.model} ({est.booking.motorcycle.license_plate})
                              </span>
                              <span className="hidden sm:inline w-1 h-1 rounded-full bg-muted-foreground/30" />
                              <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" /> {format(new Date(est.created_at), "dd MMM yyyy", { locale: th })}
                              </span>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/20 border-l-4 border-primary/20">
                              <p className="text-xs font-bold leading-relaxed opacity-60 italic line-clamp-2">"{est.description}"</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-10 shrink-0">
                        <div className="text-center lg:text-right">
                          <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-1">
                            ค่าใช้จ่ายโดยประมาณ
                          </p>
                          <p className="text-4xl font-black text-primary tracking-tighter">{formatCurrency(costValue)}</p>
                        </div>

                        {status === "pending" && (
                          <div className="flex flex-1 sm:flex-none gap-3 w-full sm:w-auto">
                            <Button
                              variant="ghost"
                              className="h-14 flex-1 sm:min-w-[120px] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                              onClick={() => setConfirmDialog({ id: est.id, action: "reject" })}
                            >
                              ปฏิเสธ
                            </Button>
                            <Button
                              className="h-14 flex-1 sm:min-w-[140px] rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                              onClick={() => setConfirmDialog({ id: est.id, action: "confirm" })}
                            >
                              <ThumbsUp className="w-4 h-4 mr-2" strokeWidth={3} />
                              ยืนยันซ่อม
                            </Button>
                          </div>
                        )}

                        {status !== "pending" && (
                          <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center text-muted-foreground/20 group-hover:text-primary transition-all">
                            <ChevronRight className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="rounded-[2.5rem] border-none bg-primary/5 p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-card flex items-center justify-center shadow-sm">
            <Info className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 space-y-1 text-center md:text-left">
            <p className="text-sm font-black uppercase tracking-tight">ขั้นตอนการดำเนินการ</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed opacity-60">
              หลังจากกคุณกดยืนยันซ่อม เจ้าหน้าที่จะทำการตรวจสอบคิวและเริ่มดำเนินการทันที โดยคุณสามารถติดตามความคืบหน้าได้ที่หน้า
              "จัดการงานซ่อม"
            </p>
          </div>
          <Button variant="outline" className="rounded-xl border-dashed border-primary/20 text-xs font-bold uppercase tracking-widest px-8">
            สอบถามเพิ่มเติม
          </Button>
        </Card>
      </div>

      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-md rounded-4xl border-none shadow-premium p-10 bg-card">
          <DialogHeader className="space-y-6">
            <div
              className={cn(
                "w-20 h-20 rounded-4xl flex items-center justify-center mx-auto ring-8 ring-opacity-20",
                confirmDialog?.action === "confirm"
                  ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/5"
                  : "bg-rose-500/10 text-rose-600 ring-rose-500/5",
              )}
            >
              {confirmDialog?.action === "confirm" ? <ThumbsUp className="w-10 h-10" /> : <ThumbsDown className="w-10 h-10" />}
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-center">
                {confirmDialog?.action === "confirm" ? "ยืนยันการรับบริการซ่อม?" : "ปฏิเสธการซ่อม?"}
              </DialogTitle>
              <DialogDescription className="text-center font-bold text-xs opacity-60 leading-relaxed px-4 pt-2">
                {confirmDialog?.action === "confirm"
                  ? "คุณตรวจสอบรายละเอียดและค่าใช้จ่ายเรียบร้อยแล้วใช่ไหม? เมื่อกดยืนยันแล้ว ทางร้านจะเริ่มดำเนินการทันที"
                  : "คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธการประเมินนี้? หากคุณมีข้อสงสัยโปรดติดต่อเจ้าหน้าที่"}
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-10">
            <Button
              variant="ghost"
              className="h-12 flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest"
              onClick={() => setConfirmDialog(null)}
            >
              ยกเลิก
            </Button>
            <Button
              className={cn(
                "h-12 flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest text-white shadow-lg",
                confirmDialog?.action === "confirm"
                  ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                  : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20",
              )}
              onClick={() => confirmDialog && updateEstimate.mutate({ estimateId: confirmDialog.id, action: confirmDialog.action })}
              disabled={updateEstimate.isPending}
            >
              {updateEstimate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "ยืนยันรายการ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

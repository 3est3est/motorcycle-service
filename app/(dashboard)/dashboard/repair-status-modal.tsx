"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  Clock,
  CheckCircle2,
  Package,
  Bike,
  AlertCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn, formatCurrency } from "@/lib/utils";

interface RepairStatusModalProps {
  repairId: string | null;
  onClose: () => void;
}

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
    cancelled: {
      label: "ยกเลิกการซ่อมแล้ว",
      variant: "destructive",
      icon: XCircle,
    },
  };

export function RepairStatusModal({
  repairId,
  onClose,
}: RepairStatusModalProps) {
  const queryClient = useQueryClient();

  const { data: repairs = [] } = useQuery({
    queryKey: ["customer-repairs"],
    queryFn: async () => {
      const res = await fetch("/api/customer/repairs");
      return res.json();
    },
    enabled: !!repairId,
  });

  const repair = repairs.find((r: any) => r.id === repairId);

  const handleConfirm = async () => {
    if (!repairId) return;
    try {
      const res = await fetch(`/api/customer/repairs/${repairId}/confirm`, {
        method: "POST",
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["customer-repairs"] });
        alert(
          "ยืนยันราคาประเมินเรียบร้อยแล้ว ช่างจะดำเนินการซ่อมโดยเร็วที่สุด",
        );
      }
    } catch (err) {
      alert("ยืนยันไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const handleCancel = async () => {
    if (!repairId) return;
    if (
      !confirm("คุณยืนยันที่จะยกเลิกงานซ่อมนี้ใช่หรือไม่? การยกเลิกจะมีผลทันที")
    )
      return;
    try {
      const res = await fetch(`/api/customer/repairs/${repairId}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["customer-repairs"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        onClose();
        alert("ยกเลิกงานซ่อมเรียบร้อยแล้ว");
      } else {
        const data = await res.json();
        alert(data.message || "ยกเลิกไม่สำเร็จ");
      }
    } catch (err) {
      alert("ยกเลิกไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  if (!repair) return null;

  const cfg = statusConfig[repair.status] || statusConfig.created;
  const isPendingConfirmation =
    !repair.customer_confirmed && repair.booking.estimate;

  return (
    <Dialog open={!!repairId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
        <div className="bg-primary p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wrench className="w-24 h-24 rotate-12" />
          </div>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <cfg.icon className="w-5 h-5 text-white" />
              </div>
              <Badge
                variant="outline"
                className="border-white/30 text-white font-bold uppercase tracking-widest text-[10px]"
              >
                {cfg.label}
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              ติดตามสถานะงานซ่อม
            </DialogTitle>
            <p className="text-primary-foreground/70 text-sm font-medium">
              หมายเลขงาน #{repair.id.slice(-8)}
            </p>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 bg-background">
          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Progress
              </span>
              <span className="text-xl font-black text-primary">
                {repair.progress}%
              </span>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden p-1 shadow-inner">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                style={{ width: `${repair.progress}%` }}
              />
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-muted">
            <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shadow-sm">
              <Bike className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                รถจักรยานยนต์
              </p>
              <p className="font-black text-foreground">
                {repair.booking.motorcycle.brand}{" "}
                {repair.booking.motorcycle.model} (
                {repair.booking.motorcycle.license_plate})
              </p>
            </div>
          </div>

          {/* Estimate / Parts Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> รายละเอียดการซ่อม
            </h4>

            {repair.booking.estimate ? (
              <div
                className={cn(
                  "p-5 rounded-[1.5rem] border-2 space-y-3 transition-all",
                  isPendingConfirmation
                    ? "bg-amber-50 border-amber-200"
                    : "bg-muted/20 border-transparent",
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                      ราคาประเมินเบื้องต้น
                    </p>
                    <p className="text-2xl font-black text-foreground">
                      {formatCurrency(repair.booking.estimate.estimated_cost)}
                    </p>
                  </div>
                  {isPendingConfirmation && (
                    <Badge
                      variant="warning"
                      className="animate-pulse font-black uppercase"
                    >
                      รอการยืนยัน
                    </Badge>
                  )}
                </div>
                <div className="pt-2 border-t border-dashed border-gray-300">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                    หมายเหตุช่าง
                  </p>
                  <p className="text-sm font-medium italic">
                    &ldquo; {repair.booking.estimate.description} &rdquo;
                  </p>
                </div>

                {isPendingConfirmation && (
                  <Button
                    className="w-full mt-2 rounded-xl font-black h-12 shadow-lg shadow-amber-200"
                    variant="warning"
                    onClick={handleConfirm}
                  >
                    ยืนยันการซ่อม (ยอมรับราคา)
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-5 bg-muted/20 rounded-[1.5rem] text-center border-2 border-dashed border-muted">
                <p className="text-sm text-muted-foreground font-medium">
                  อยู่ระหว่างการตรวจสอบโดยช่าง...
                </p>
              </div>
            )}
          </div>

          {repair.repair_parts?.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  รายการอะไหล่และค่าแรงจริง
                </h4>
                {!repair.customer_confirmed && (
                  <Badge variant="destructive" className="text-[9px]">
                    รอยืนยันราคาจริง
                  </Badge>
                )}
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {repair.repair_parts.map((rp: any) => (
                  <div
                    key={rp.id}
                    className="flex justify-between items-center text-sm p-3 bg-muted/10 rounded-xl border border-muted/20"
                  >
                    <span className="font-bold">
                      {rp.part.name}{" "}
                      <span className="text-muted-foreground text-xs ml-1">
                        x{rp.quantity}
                      </span>
                    </span>
                    <span className="font-black text-primary">
                      {formatCurrency(rp.price_total)}
                    </span>
                  </div>
                ))}
                {Number(repair.labor_cost) > 0 && (
                  <div className="flex justify-between items-center text-sm p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <span className="font-bold">ค่าบริการ/ค่าแรง</span>
                    <span className="font-black text-primary">
                      {formatCurrency(Number(repair.labor_cost))}
                    </span>
                  </div>
                )}
              </div>

              {!repair.customer_confirmed && (
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">
                      ยอดสุทธิที่ต้องชำระ
                    </span>
                    <span className="text-xl font-black text-primary">
                      {formatCurrency(
                        repair.repair_parts.reduce(
                          (acc: number, curr: any) =>
                            acc + Number(curr.price_total),
                          0,
                        ) + Number(repair.labor_cost),
                      )}
                    </span>
                  </div>
                  <Button
                    className="w-full rounded-xl font-black h-11 shadow-md"
                    onClick={handleConfirm}
                  >
                    ยืนยันราคาและดำเนินการต่อ
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {repair.status === "created" && (
              <Button
                className="w-full rounded-2xl h-12 font-black text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-2 border-rose-100 transition-all active:scale-95"
                variant="ghost"
                onClick={handleCancel}
              >
                ยกเลิกงานซ่อม
              </Button>
            )}

            <Button
              className="w-full rounded-2xl h-12 font-black border-2 border-primary/10 hover:bg-muted transition-all active:scale-95"
              variant="ghost"
              onClick={onClose}
            >
              ปิดหน้านี้
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

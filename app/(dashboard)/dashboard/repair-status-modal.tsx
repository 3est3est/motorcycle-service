"use client";

import { useState } from "react";
import { Wrench, Clock, CheckCircle2, Package, Bike, AlertCircle, Loader2, XCircle, AlertTriangle } from "lucide-react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface RepairStatusModalProps {
  repairId: string | null;
  onClose: () => void;
}

const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
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

export function RepairStatusModal({ repairId, onClose }: RepairStatusModalProps) {
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
    setActionLoading(true);
    try {
      const res = await fetch(`/api/customer/repairs/${repairId}/confirm`, {
        method: "POST",
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["customer-repairs"] });
      }
    } catch {
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!repairId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/customer/repairs/${repairId}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["customer-repairs"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        setShowCancelConfirm(false);
        onClose();
      }
    } catch {
    } finally {
      setActionLoading(false);
    }
  };

  if (!repair) return null;

  const cfg = statusConfig[repair.status] || statusConfig.created;
  const isPendingConfirmation = !repair.customer_confirmed && repair.booking.estimate;

  return (
    <Dialog open={!!repairId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-premium rounded-[2.5rem]">
        {showCancelConfirm && (
          <div className="absolute inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 px-6 text-foreground">
            <div className="bg-card rounded-[2.5rem] p-10 space-y-6 shadow-2xl border border-primary/10 w-full animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <h4 className="font-black text-xl uppercase tracking-tight">ยืนยันการยกเลิก</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">Cancellation is irreversible</p>
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                คุณยืนยันที่จะ{" "}
                <span className="text-destructive font-black underline decoration-destructive/30 underline-offset-4">ยกเลิกงานซ่อมนี้</span>{" "}
                ใช่หรือไม่? อะไหล่ที่ถูกเบิกไปแล้วจะได้รับการคืนสต็อกโดยระบบ
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="destructive"
                  className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-destructive/20"
                  onClick={handleCancel}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ยืนยันยกเลิกรายการนี้"}
                </Button>
                <Button
                  variant="ghost"
                  className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs opacity-60 hover:opacity-100"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={actionLoading}
                >
                  ย้อนกลับ
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="relative">
          <div className="bg-primary p-12 text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 p-12 opacity-10">
              <Wrench className="w-48 h-48 rotate-12" />
            </div>
            <div className="relative z-10 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[1.25rem] bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <cfg.icon className="w-7 h-7 text-white" />
                </div>
                <div className="px-5 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm shadow-sm inline-flex items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{cfg.label}</span>
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tight leading-none mb-2">ติดตามสถานะ</h3>
                <p className="text-primary-foreground/60 text-[10px] font-black uppercase tracking-[0.25em]">
                  Repair ID • #{repair.id.slice(-8)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-10 bg-card max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Status Check</span>
                <span className="text-3xl font-black text-primary tracking-tighter">{repair.progress}%</span>
              </div>
              <div className="h-4 w-full bg-muted rounded-full overflow-hidden p-1 shadow-inner ring-1 ring-primary/5">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{ width: `${repair.progress}%` }}
                />
              </div>
            </div>

            <Separator className="opacity-50" />

            <div className="flex items-center gap-6 p-6 bg-muted/30 rounded-3xl border border-primary/5 group transition-premium hover:bg-muted/50">
              <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center shadow-premium transition-transform group-hover:scale-105">
                <Bike className="w-8 h-8 text-primary/60" />
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest mb-1.5">Registered Vehicle</p>
                <p className="font-black text-lg tracking-tight uppercase">
                  {repair.booking.motorcycle.brand} {repair.booking.motorcycle.model}
                </p>
                <p className="text-xs font-bold text-muted-foreground/60 mt-1">{repair.booking.motorcycle.license_plate}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Estimate Details
                </h4>
                {isPendingConfirmation && (
                  <Badge
                    variant="outline"
                    className="text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-1"
                  >
                    Awaiting Approval
                  </Badge>
                )}
              </div>

              {repair.booking.estimate ? (
                <div
                  className={cn(
                    "p-8 rounded-4xl border-2 transition-all space-y-6",
                    isPendingConfirmation
                      ? "bg-amber-500/5 border-amber-500/20 shadow-lg shadow-amber-500/5"
                      : "bg-muted/10 border-transparent shadow-inner",
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-2">Estimated Cost</p>
                      <p className="text-3xl font-black text-foreground tracking-tighter">
                        {formatCurrency(repair.booking.estimate.estimated_cost)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-dashed border-primary/10">
                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-3">Staff Remarks</p>
                    <p className="text-sm font-medium italic opacity-70 leading-relaxed">
                      &ldquo; {repair.booking.estimate.description} &rdquo;
                    </p>
                  </div>

                  {isPendingConfirmation && (
                    <Button
                      className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-amber-500/10 bg-amber-500 hover:bg-amber-600 border-none transition-premium active:scale-95 mt-4"
                      onClick={handleConfirm}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm & Proceed"}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="p-10 bg-muted/30 rounded-4xl text-center border-2 border-dashed border-muted flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground/40 font-black uppercase tracking-[0.2em]">Inspecting vehicle...</p>
                </div>
              )}
            </div>

            {repair.repair_parts?.length > 0 && (
              <div className="space-y-6 border-t pt-10">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Itemized Costing</h4>
                  {!repair.customer_confirmed && (
                    <Badge variant="destructive" className="text-[9px] font-black uppercase px-3">
                      Pending Verification
                    </Badge>
                  )}
                </div>
                <div className="space-y-3">
                  {repair.repair_parts.map((rp: any) => (
                    <div
                      key={rp.id}
                      className="flex justify-between items-center p-5 bg-muted/20 rounded-2xl border border-transparent hover:border-primary/10 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-black uppercase tracking-tight">{rp.part.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest">
                          Qty: {rp.quantity}
                        </p>
                      </div>
                      <span className="font-black text-sm tracking-tighter text-primary">{formatCurrency(rp.price_total)}</span>
                    </div>
                  ))}
                  {Number(repair.labor_cost) > 0 && (
                    <div className="flex justify-between items-center p-5 bg-primary/5 rounded-2xl border border-primary/10">
                      <span className="text-xs font-black uppercase tracking-widest text-primary/80">Labor / Service Fee</span>
                      <span className="font-black text-sm tracking-tighter text-primary">{formatCurrency(Number(repair.labor_cost))}</span>
                    </div>
                  )}
                </div>

                {!repair.customer_confirmed && (
                  <div className="p-8 bg-primary/5 rounded-3xl border border-primary/10 space-y-6">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total Verified Amount</p>
                      <p className="text-3xl font-black text-primary tracking-tighter">
                        {formatCurrency(
                          repair.repair_parts.reduce((acc: number, curr: any) => acc + Number(curr.price_total), 0) +
                            Number(repair.labor_cost),
                        )}
                      </p>
                    </div>
                    <Button
                      className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 transition-premium active:scale-95"
                      onClick={handleConfirm}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Approve Verified Pricing"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              {repair.status === "created" && (
                <Button
                  variant="outline"
                  className="h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-destructive border-2 border-destructive/20 hover:bg-destructive/10 transition-premium active:scale-95"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel Repair Request
                </Button>
              )}
              <Button
                variant="ghost"
                className="h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-muted hover:bg-muted transition-premium active:scale-95"
                onClick={onClose}
              >
                Close Tracking
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

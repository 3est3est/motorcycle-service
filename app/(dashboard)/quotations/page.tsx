"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import {
  FileSearch,
  Bike,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  Package,
  ThumbsUp,
  ThumbsDown,
  Wrench,
  AlertCircle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface QuotationItem {
  id: string;
  description: string;
  labor: number | { toNumber: () => number };
  part_id: string | null;
  part_qty: number | null;
  part: { id: string; name: string; price: number } | null;
}

interface Quotation {
  id: string;
  booking_id: string;
  status: string;
  created_at: string;
  items: QuotationItem[];
  booking: {
    id: string;
    customer?: { full_name: string; phone: string };
    motorcycle: { brand: string; model: string; license_plate: string };
  };
}

const statusCfg: Record<string, { label: string; color: string; icon: any }> = {
  pending_customer_approval: {
    label: "รอยืนยัน",
    color: "bg-amber-500/10 text-amber-600",
    icon: Clock,
  },
  approved: {
    label: "อนุมัติแล้ว",
    color: "bg-emerald-500/10 text-emerald-600",
    icon: CheckCircle2,
  },
  rejected: {
    label: "ปฏิเสธ",
    color: "bg-rose-500/10 text-rose-600",
    icon: XCircle,
  },
};

export default function QuotationsPage() {
  const queryClient = useQueryClient();
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    id: string;
    action: "approve" | "reject";
  } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const res = await fetch("/api/quotations");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const getNum = (val: any) => {
    if (typeof val === "number") return val;
    if (val && typeof val.toNumber === "function") return val.toNumber();
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const calcTotal = (items: QuotationItem[]) => {
    return items.reduce((sum, item) => {
      const labor = getNum(item.labor);
      const partCost = item.part ? getNum(item.part.price) * (item.part_qty || 1) : 0;
      return sum + labor + partCost;
    }, 0);
  };

  const handleAction = (quotationId: string, action: "approve" | "reject") => {
    setConfirmDialog({ id: quotationId, action });
  };

  const doAction = async () => {
    if (!confirmDialog) return;
    const { id: quotationId, action } = confirmDialog;
    setConfirmDialog(null);
    setActionId(quotationId);
    try {
      const res = await fetch(`/api/quotations/${quotationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["quotations"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        toast.success(action === "approve" ? "อนุมัติใบเสนอราคาเรียบร้อย! ช่างจะเริ่มดำเนินการทันที" : "ปฏิเสธใบเสนอราคาเรียบร้อยแล้ว");
      } else {
        const data = await res.json();
        toast.error(data.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("ทำรายการไม่สำเร็จ");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="animate-fluid pb-20 max-w-7xl mx-auto">
      {/* Confirm Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                confirmDialog?.action === "approve" ? "bg-emerald-500/10" : "bg-rose-500/10",
              )}
            >
              {confirmDialog?.action === "approve" ? (
                <ThumbsUp className="w-6 h-6 text-emerald-500" />
              ) : (
                <ThumbsDown className="w-6 h-6 text-rose-500" />
              )}
            </div>
            <DialogTitle className="text-xl font-bold">
              {confirmDialog?.action === "approve" ? "ยืนยันอนุมัติ" : "ยืนยันปฏิเสธ"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.action === "approve"
                ? "คุณต้องการอนุมัติใบเสนอราคานี้ใช่ไหม? ช่างจะเริ่มซ่อมรถจักรยานยนต์ทันที"
                : "คุณแน่ใจว่าต้องการปฏิเสธใบเสนอราคานี้? รายการซ่อมอาจถูกยกเลิก"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setConfirmDialog(null)} className="rounded-xl">
              ยกเลิก
            </Button>
            <Button
              variant={confirmDialog?.action === "approve" ? "default" : "destructive"}
              onClick={doAction}
              className="rounded-xl font-bold uppercase tracking-widest text-xs"
            >
              ยืนยัน{confirmDialog?.action === "approve" ? "อนุมัติ" : "ปฏิเสธ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TopBar title="ใบเสนอราคา" subtitle="ตรวจสอบและพิจารณารายการค่าซ่อมเบื้องต้น" />

      <div className="px-6 space-y-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-3xl" />
            ))}
          </div>
        ) : quotations.length === 0 ? (
          <div className="py-24 text-center border bg-muted/10 rounded-[2.5rem] border-dashed flex flex-col items-center gap-8">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center opacity-20">
              <FileSearch className="w-10 h-10" />
            </div>
            <p className="text-sm font-bold opacity-30 uppercase tracking-[0.25em]">ยังไม่มีใบเสนอราคาในขณะนี้</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quotations.map((qt: Quotation) => {
              const status = qt.status || "pending_customer_approval";
              const cfg = statusCfg[status] || statusCfg.pending_customer_approval;
              const Icon = cfg.icon;
              const isPending = status === "pending_customer_approval";
              const isExpanded = expandedId === qt.id;
              const total = calcTotal(qt.items);

              return (
                <Card
                  key={qt.id}
                  className={cn(
                    "border border-border/50 shadow-sm transition-all overflow-hidden bg-card/80 backdrop-blur-sm rounded-[2.5rem] group hover:bg-card",
                    isPending && "ring-1 ring-primary/20",
                  )}
                >
                  <CardContent className="p-0">
                    <div className="p-8 flex flex-col sm:flex-row justify-between gap-10">
                      <div className="flex items-start gap-6">
                        <div
                          className={cn(
                            "w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 border-none transition-all group-hover:scale-110",
                            cfg.color,
                            "bg-current/10 shadow-lg shadow-current/10",
                          )}
                        >
                          <Icon className="w-10 h-10" />
                        </div>
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <h4 className="font-black text-2xl tracking-tighter uppercase text-foreground">
                              #QT-{qt.id.slice(-6).toUpperCase()}
                            </h4>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-none",
                                cfg.color,
                                "bg-current/10",
                              )}
                            >
                              {cfg.label}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                              <span className="flex items-center gap-2 text-foreground/80">
                                <Bike className="w-4 h-4 text-primary" strokeWidth={2.5} /> {qt.booking.motorcycle.brand}{" "}
                                {qt.booking.motorcycle.model}
                              </span>
                              <span className="flex items-center gap-2 border-l border-border/50 pl-6">
                                <FileSearch className="w-4 h-4 text-primary/60" /> {qt.booking.motorcycle.license_plate}
                              </span>
                              <span className="hidden sm:flex items-center gap-2 border-l border-border/50 pl-6">
                                <Clock className="w-4 h-4 text-primary/60" />{" "}
                                {format(new Date(qt.created_at), "d MMM yyyy", {
                                  locale: th,
                                })}
                              </span>
                            </div>
                            {qt.booking.customer && (
                              <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-4 h-4" /> {qt.booking.customer.full_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-10">
                        <div className="text-center sm:text-right space-y-1">
                          <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">ยอดรวมประมาณการ</p>
                          <p className="text-4xl font-black text-emerald-500 tracking-tighter drop-shadow-sm">{formatCurrency(total)}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          {isPending && (
                            <>
                              <Button
                                variant="outline"
                                className="h-14 w-14 rounded-2xl border-none bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 active:scale-95 transition-all"
                                onClick={() => handleAction(qt.id, "reject")}
                                disabled={actionId === qt.id}
                              >
                                <ThumbsDown className="w-5 h-5" strokeWidth={2.5} />
                              </Button>
                              <Button
                                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 active:scale-95 transition-all bg-primary hover:bg-primary/90"
                                onClick={() => handleAction(qt.id, "approve")}
                                disabled={actionId === qt.id}
                              >
                                {actionId === qt.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <>
                                    <ThumbsUp className="w-5 h-5 mr-3" strokeWidth={2.5} /> อนุมัติ
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-14 w-14 rounded-2xl bg-muted/50 hover:bg-muted transition-all",
                              isExpanded && "bg-primary/10 text-primary",
                            )}
                            onClick={() => setExpandedId(isExpanded ? null : qt.id)}
                          >
                            <ChevronRight
                              className={cn("w-6 h-6 transition-transform duration-500", isExpanded && "rotate-90")}
                              strokeWidth={2.5}
                            />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border/50 animate-in slide-in-from-top-4 duration-500">
                        <div className="p-8 sm:p-10 space-y-8 bg-muted/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Package className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/80">
                                รายละเอียดค่าบริการและอะไหล่
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="rounded-full px-4 border-border/50 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest"
                            >
                              {qt.items.length} รายการ
                            </Badge>
                          </div>

                          <div className="rounded-4xl border border-border/50 overflow-hidden bg-card shadow-inner">
                            <Table>
                              <TableHeader className="bg-muted/50 border-none">
                                <TableRow className="hover:bg-transparent border-none">
                                  <TableHead className="text-[11px] font-black uppercase px-8 py-5 text-muted-foreground/60">
                                    รายการซ่อม/เช็ค
                                  </TableHead>
                                  <TableHead className="text-[11px] font-black uppercase text-center text-muted-foreground/60">
                                    อะไหล่ที่ใช้
                                  </TableHead>
                                  <TableHead className="text-[11px] font-black uppercase text-center text-muted-foreground/60">
                                    จำนวน
                                  </TableHead>
                                  <TableHead className="text-[11px] font-black uppercase text-right text-muted-foreground/60">
                                    ค่าแรง
                                  </TableHead>
                                  <TableHead className="text-[11px] font-black uppercase text-right px-8 text-muted-foreground/60">
                                    รวม
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {qt.items.map((item) => {
                                  const labor = getNum(item.labor);
                                  const partPrice = item.part ? getNum(item.part.price) * (item.part_qty || 1) : 0;
                                  return (
                                    <TableRow key={item.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                                      <TableCell className="px-8 py-6 font-bold text-foreground">{item.description}</TableCell>
                                      <TableCell className="text-center text-[11px] font-bold text-muted-foreground/70 uppercase">
                                        {item.part ? (
                                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
                                            <Wrench className="w-3.5 h-3.5 text-primary/60" /> {item.part.name}
                                          </span>
                                        ) : (
                                          <span className="opacity-20 italic font-normal">ไม่มีอะไหล่</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center font-black text-foreground">{item.part_qty || "—"}</TableCell>
                                      <TableCell className="text-right font-bold text-muted-foreground">{formatCurrency(labor)}</TableCell>
                                      <TableCell className="text-right font-black text-emerald-500 px-8">
                                        {formatCurrency(labor + partPrice)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                              <TableFooter className="bg-muted/50 border-none">
                                <TableRow className="hover:bg-transparent">
                                  <TableCell
                                    colSpan={4}
                                    className="text-right py-8 text-[11px] font-black uppercase tracking-[0.35em] text-muted-foreground/40"
                                  >
                                    สรุปการประเมินราคาทั้งสิ้น
                                  </TableCell>
                                  <TableCell className="text-right text-2xl font-black text-emerald-500 px-8 py-8">
                                    {formatCurrency(total)}
                                  </TableCell>
                                </TableRow>
                              </TableFooter>
                            </Table>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

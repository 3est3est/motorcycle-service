"use client";

import { useRef, useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import {
  CreditCard,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Bike,
  ChevronRight,
  Search,
  Upload,
  ImageIcon,
  X,
  AlertCircle,
  Hash,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/lib/hooks/use-profile";
import { ReportExportButton } from "@/components/pdf/report-export-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface Payment {
  id: string;
  amount: number | { toNumber: () => number };
  method: string;
  status: string;
  slip_url?: string | null;
  paid_at: string | null;
  created_at: string;
  repair_job: {
    id: string;
    booking: {
      motorcycle: {
        brand: string;
        model: string;
        license_plate: string;
      };
    };
  };
}

const paymentStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: {
    label: "รอชำระเงิน",
    color: "bg-amber-500/10 text-amber-600",
    icon: Clock,
  },
  success: {
    label: "ชำระเงินแล้ว",
    color: "bg-emerald-500/10 text-emerald-600",
    icon: CheckCircle2,
  },
  failed: {
    label: "ล้มเหลว",
    color: "bg-rose-500/10 text-rose-600",
    icon: XCircle,
  },
};

const methodLabels: Record<string, string> = {
  CASH: "เงินสด",
  TRANSFER: "โอนเงิน",
  QR_TRANSFER: "Thai QR",
};

function SlipUploadModal({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(payment.slip_url || null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadSlip = useMutation({
    mutationFn: async (slipUrl: string) => {
      const res = await fetch(`/api/payments/${payment.id}/slip`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slip_url: slipUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "เกิดข้อผิดพลาด");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("อัปโหลดสลิปเรียบร้อยแล้ว กรูณารอเจ้าหน้าที่ตรวจสอบ");
      onClose();
    },
    onError: (err: any) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const getAmount = (amount: any) => {
    if (typeof amount === "number") return amount;
    if (amount && typeof amount.toNumber === "function") return amount.toNumber();
    const num = Number(amount);
    return isNaN(num) ? 0 : num;
  };

  const amountValue = getAmount(payment.amount);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-premium p-0 overflow-hidden bg-card">
        <DialogHeader className="p-8 pb-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">แนบสลิปชำระเงิน</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                {methodLabels[payment.method]} • {formatCurrency(amountValue)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {(payment.method === "TRANSFER" || payment.method === "QR_TRANSFER") && (
            <Card className="border-none bg-primary/5 p-5 rounded-2xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 mb-2">บัญชีรับโอนเงิน</p>
              <p className="font-black text-sm tracking-tight">ธ.กสิกรไทย 123-4-56789-0</p>
              <p className="text-xs font-bold text-muted-foreground opacity-60">ป่าโยวเย่ การช่าง จำกัด</p>
            </Card>
          )}

          <div className="space-y-4">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            {preview ? (
              <div className="relative rounded-4xl overflow-hidden border-2 border-primary/20 aspect-3/4 bg-muted/20">
                <img src={preview} alt="Slip" className="w-full h-full object-contain" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-4 right-4 h-8 w-8 rounded-xl shadow-lg"
                  onClick={() => {
                    setPreview(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-48 rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 flex flex-col gap-4 group transition-all"
                onClick={() => fileRef.current?.click()}
              >
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-card flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-7 h-7 text-primary" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <p className="font-black text-xs uppercase tracking-widest">แตะเพื่ออัปโหลดสลิป</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">PNG, JPG ไม่เกิน 5MB</p>
                </div>
              </Button>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/5 text-rose-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-8 pt-0 gap-3">
          <Button variant="ghost" className="rounded-xl font-bold text-xs uppercase" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            className="flex-1 rounded-xl font-black uppercase tracking-widest text-xs h-12 shadow-lg shadow-primary/20"
            disabled={!preview || uploadSlip.isPending}
            onClick={() => preview && uploadSlip.mutate(preview)}
          >
            {uploadSlip.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "ส่งข้อมูลชำระเงิน"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PaymentsPage() {
  const { data: profile } = useProfile();
  const isStaff = profile?.role === "admin" || profile?.role === "staff";
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await fetch("/api/payments");
      if (!res.ok) throw new Error("Could not fetch payments");
      return res.json();
    },
  });

  const getAmount = (amount: any) => {
    if (typeof amount === "number") return amount;
    if (amount && typeof amount.toNumber === "function") return amount.toNumber();
    const num = Number(amount);
    return isNaN(num) ? 0 : num;
  };

  const queryClient = useQueryClient();
  const confirmPayment = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "success" }),
      });
      if (!res.ok) throw new Error("ยืนยันไม่สำเร็จ");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("ยืนยันการชำระเงินเรียบร้อยแล้ว");
    },
  });

  const filteredPayments = payments.filter((p: Payment) => {
    if (filter === "pending" && p.status !== "pending") return false;
    if (filter === "success" && p.status !== "success") return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        p.id.toLowerCase().includes(s) ||
        p.repair_job.booking.motorcycle.model.toLowerCase().includes(s) ||
        p.repair_job.booking.motorcycle.license_plate.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="animate-fluid pb-20 max-w-7xl mx-auto">
      <TopBar title="การชำระเงิน" subtitle="ประวัติการชำระเงินและบิลค้างชำระ" />

      <div className="px-6 space-y-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="ค้นหาบิลหรือรถ..."
              className="h-12 pl-12 rounded-2xl bg-muted/30 border-none font-bold focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
              <TabsList className="bg-muted/50 p-1 rounded-xl h-11 border-none grid grid-cols-3">
                <TabsTrigger value="all" className="rounded-lg font-bold text-[10px] uppercase tracking-widest px-6">
                  ทั้งหมด
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg font-bold text-[10px] uppercase tracking-widest px-6">
                  ค้างชำระ
                </TabsTrigger>
                <TabsTrigger value="success" className="rounded-lg font-bold text-[10px] uppercase tracking-widest px-6">
                  สำเร็จ
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {isStaff && (
              <ReportExportButton
                type="REVENUE"
                data={payments}
                stats={{
                  totalCount: payments.length,
                  totalRevenue: payments.reduce((s, p) => s + getAmount(p.amount), 0),
                }}
                label="Export Revenue"
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xl font-bold tracking-tight">รายการธุรกรรม ({filteredPayments.length})</h3>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-3xl" />
              ))}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-24 text-center border bg-muted/10 rounded-[2.5rem] border-dashed flex flex-col items-center gap-8">
              <Receipt className="w-12 h-12 text-muted-foreground/20" strokeWidth={1.5} />
              <p className="text-sm font-bold opacity-30 uppercase tracking-[0.25em]">ไม่พบรายการชำระเงิน</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredPayments.map((payment) => {
                const cfg = paymentStatusConfig[payment.status] || paymentStatusConfig.pending;
                const Icon = cfg.icon;
                const amountValue = getAmount(payment.amount);
                const needsSlip = payment.status === "pending" && (payment.method === "TRANSFER" || payment.method === "QR_TRANSFER");
                const hasSlip = !!payment.slip_url;

                return (
                  <Card key={payment.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-card/50 group">
                    <CardContent className="p-0">
                      <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                          <div
                            className={cn(
                              "w-16 h-16 rounded-3xl flex items-center justify-center border transition-all group-hover:scale-105",
                              cfg.color,
                            )}
                          >
                            <Icon className="w-8 h-8" />
                          </div>
                          <div className="space-y-2 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h4 className="font-black text-xl tracking-tight uppercase">#PAY-{payment.id.slice(-8).toUpperCase()}</h4>
                              <Badge
                                variant="secondary"
                                className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border-none", cfg.color)}
                              >
                                {cfg.label}
                              </Badge>
                              {hasSlip && payment.status === "pending" && (
                                <Badge className="bg-blue-500 text-white text-[8px] font-black uppercase tracking-widest animate-pulse border-none">
                                  ✓ แนบสลิปแล้ว
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                              <span className="flex items-center gap-1.5">
                                <Receipt className="w-3.5 h-3.5 text-primary" /> {methodLabels[payment.method]}
                              </span>
                              <span className="hidden sm:inline w-1 h-1 rounded-full bg-muted-foreground/30" />
                              <span className="flex items-center gap-1.5">
                                <Bike className="w-3.5 h-3.5" /> {payment.repair_job.booking.motorcycle.brand}{" "}
                                {payment.repair_job.booking.motorcycle.model}
                              </span>
                              <span className="hidden sm:inline w-1 h-1 rounded-full bg-muted-foreground/30" />
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> {new Date(payment.created_at).toLocaleDateString("th-TH")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-8 shrink-0">
                          <div className="text-center sm:text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-1">ยอดรวมสุทธิ</p>
                            <p className="text-3xl font-black text-emerald-600 tracking-tighter drop-shadow-sm">
                              {formatCurrency(amountValue)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            {payment.status === "pending" ? (
                              <div className="flex flex-1 sm:flex-none gap-3">
                                {isStaff && (
                                  <Button
                                    className="h-12 flex-1 sm:min-w-[140px] rounded-xl font-black uppercase tracking-widest text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                                    onClick={() => confirmPayment.mutate(payment.id)}
                                    disabled={confirmPayment.isPending}
                                  >
                                    {confirmPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "ยืนยันรับเงิน"}
                                  </Button>
                                )}

                                {!isStaff && payment.method === "CASH" && (
                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-4 py-3 bg-muted/40 rounded-xl border border-dashed text-center flex-1">
                                    รอชำระที่เคาน์เตอร์
                                  </p>
                                )}

                                {needsSlip && (
                                  <Button
                                    variant={hasSlip ? "outline" : "default"}
                                    className="h-12 flex-1 sm:min-w-[140px] rounded-xl font-black uppercase tracking-widest text-xs"
                                    onClick={() => setSelectedPayment(payment)}
                                  >
                                    {hasSlip ? "ตรวจสอบสลิป" : "แนบสลิป"}
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground/20 group-hover:text-primary transition-colors">
                                <ChevronRight className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {hasSlip && (
                        <div className="px-8 pb-8 pt-0 flex gap-4 animate-in fade-in slide-in-from-top-2">
                          <div className="p-1 rounded-xl bg-background border shadow-sm">
                            <img
                              src={payment.slip_url!}
                              alt="slip"
                              className="h-16 w-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setSelectedPayment(payment)}
                            />
                          </div>
                          <div className="flex flex-col justify-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">สลิปการโอน</p>
                            <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">คลิกเพื่อตรวจสอบรายละเอียด</p>
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

      {selectedPayment && <SlipUploadModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />}
    </div>
  );
}

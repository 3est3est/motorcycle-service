"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Trash2,
  Plus,
  Loader2,
  Wrench,
  Bike,
  AlertCircle,
  CheckCircle2,
  X,
  CreditCard,
  UserCheck,
  FileText,
  FileSearch,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  BadgeCheck,
  Download,
  Receipt,
  FileDigit,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn, formatCurrency } from "@/lib/utils";
import { ExportPDFButton } from "@/components/pdf/export-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface RepairDetailModalProps {
  job: any | null;
  onClose: () => void;
}

type ModalTab = "estimate" | "quotation" | "parts" | "payment";

export function RepairDetailModal({ job, onClose }: RepairDetailModalProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>("estimate");

  // Estimate fields
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("0");

  // Labor cost
  const [laborCost, setLaborCost] = useState("0");

  // Parts
  const [selectedPartId, setSelectedPartId] = useState<string>("");
  const [partQty, setPartQty] = useState(1);

  // Quotation builder
  const [quotationItems, setQuotationItems] = useState<
    {
      description: string;
      labor: number;
      part_id?: string;
      part_qty?: number;
    }[]
  >([]);
  const [newQItem, setNewQItem] = useState({
    description: "",
    labor: 0,
    part_id: "",
    part_qty: 1,
  });

  // Mechanic assignment
  const [assignedStaffId, setAssignedStaffId] = useState<string>("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "QR_TRANSFER">("CASH");
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // ------ Queries ------
  const { data: estimate } = useQuery({
    queryKey: ["estimate", job?.booking_id],
    queryFn: async () => {
      if (!job) return null;
      const res = await fetch(`/api/staff/estimates/${job.booking_id}`);
      if (res.ok) return res.json();
      return null;
    },
    enabled: !!job,
  });

  const { data: existingQuotation } = useQuery({
    queryKey: ["quotation-staff", job?.booking_id],
    queryFn: async () => {
      if (!job) return null;
      const res = await fetch(`/api/quotations/${job.booking_id}`);
      if (res.ok) return res.json();
      return null;
    },
    enabled: !!job,
  });

  const { data: jobParts = [] } = useQuery({
    queryKey: ["repair-parts", job?.id],
    queryFn: async () => {
      if (!job) return [];
      const res = await fetch(`/api/staff/repairs/${job.id}/parts`);
      return res.json();
    },
    enabled: !!job,
  });

  const { data: allParts = [] } = useQuery({
    queryKey: ["parts"],
    queryFn: async () => {
      const res = await fetch("/api/parts");
      return res.json();
    },
    enabled: !!job,
  });

  const { data: existingPayment, refetch: refetchPayment } = useQuery({
    queryKey: ["payment-for-job", job?.id],
    queryFn: async () => {
      if (!job) return null;
      const res = await fetch("/api/staff/payments");
      if (!res.ok) return null;
      const all = await res.json();
      return all.find((p: any) => p.repair_job_id === job.id) ?? null;
    },
    enabled: !!job,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const res = await fetch("/api/staff/users");
      if (!res.ok) return [];
      const users = await res.json();
      return users.filter((u: any) => u.role === "staff" || u.role === "admin");
    },
    enabled: !!job,
  });

  useEffect(() => {
    if (estimate) {
      setDescription(estimate.description || "");
      setEstimatedCost(estimate.estimated_cost?.toString() || "0");
    }
    if (job) {
      setLaborCost(job.labor_cost?.toString() || "0");
      setAssignedStaffId(job.assigned_staff_id || "");
    }
    if (existingQuotation?.items) {
      setQuotationItems(
        existingQuotation.items.map((it: any) => ({
          description: it.description,
          labor: Number(it.labor),
          part_id: it.part_id || "",
          part_qty: it.part_qty || 1,
        })),
      );
    }
  }, [estimate, job, existingQuotation]);

  // ------ Handlers ------
  const handleSaveEstimate = async () => {
    if (!job) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/estimates/${job.booking_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          estimated_cost: parseFloat(estimatedCost),
        }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({
          queryKey: ["estimate", job.booking_id],
        });
        toast.success("บันทึกใบประเมินแล้ว ลูกค้าจะได้รับแจ้งเตือนทันที");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMechanic = async (staffId: string) => {
    if (!job) return;
    setAssignedStaffId(staffId);
    try {
      const res = await fetch(`/api/staff/repairs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_staff_id: staffId }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["repairs"] });
        toast.success("มอบหมายช่างสำเร็จ");
      }
    } catch {
      toast.error("มอบหมายช่างไม่สำเร็จ");
    }
  };

  const handleAddQuotationItem = () => {
    if (!newQItem.description && newQItem.labor === 0) return;
    setQuotationItems((prev) => [
      ...prev,
      {
        description: newQItem.description,
        labor: newQItem.labor,
        part_id: newQItem.part_id || undefined,
        part_qty: newQItem.part_id ? newQItem.part_qty : undefined,
      },
    ]);
    setNewQItem({ description: "", labor: 0, part_id: "", part_qty: 1 });
  };

  const handleRemoveQuotationItem = (idx: number) => {
    setQuotationItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveQuotation = async () => {
    if (!job || quotationItems.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: job.booking_id,
          items: quotationItems,
        }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({
          queryKey: ["quotation-staff", job.booking_id],
        });
        toast.success("บันทึกใบเสนอราคาแล้ว รอลูกค้าเข้ามาอนุมัติ");
      }
    } catch {
      toast.error("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!job) return;
    const totalPartsAmount = jobParts.reduce((sum: number, pj: any) => sum + Number(pj.price_total), 0);
    const totalAmount = totalPartsAmount + parseFloat(laborCost || "0");
    if (totalAmount <= 0) {
      toast.error("กรุณาระบุราคาอะไหล่หรือค่าแรงก่อนสร้างบิล");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repair_job_id: job.id,
          amount: totalAmount,
          method: paymentMethod,
        }),
      });
      if (res.ok) {
        setShowPaymentForm(false);
        queryClient.invalidateQueries({ queryKey: ["repairs"] });
        refetchPayment();
        toast.success("สร้างบิลสำเร็จ! ลูกค้าสามารถชำระผ่านแอปได้ทันที");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการสร้างบิล");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!existingPayment) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/${existingPayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "success" }),
      });
      if (res.ok) {
        refetchPayment();
        queryClient.invalidateQueries({ queryKey: ["repairs"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        toast.success("ยืนยันการชำระเงินสำเร็จ มอบคะแนนสะสมให้ลูกค้าแล้ว");
      }
    } catch {
      toast.error("ยืนยันไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPart = async () => {
    if (!job || !selectedPartId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/repairs/${job.id}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part_id: selectedPartId, quantity: partQty }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["repair-parts", job.id] });
        setSelectedPartId("");
        setPartQty(1);
        toast.success("เพิ่มรายการอะไหล่สำเร็จ");
      }
    } catch {
      toast.error("เพิ่มอะไหล่ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePart = async (partItemId: string) => {
    if (!job) return;
    try {
      const res = await fetch(`/api/staff/repairs/parts/${partItemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["repair-parts", job.id] });
        toast.info("ลบรายการอะไหล่แล้ว");
      }
    } catch {
      toast.error("ลบไม่สำเร็จ");
    }
  };

  const handleUpdateJob = async (status?: string, progress?: number) => {
    if (!job) return;
    setLoading(true);
    try {
      const body: any = {};
      if (status) body.status = status;
      if (progress !== undefined) body.progress = progress;
      if (laborCost) body.labor_cost = parseFloat(laborCost);
      const res = await fetch(`/api/staff/repairs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["repairs"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        toast.success("อัปเดตสถานะงานซ่อมแล้ว");
        onClose();
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  const partsTotal = jobParts.reduce((s: number, p: any) => s + Number(p.price_total), 0);
  const grandTotal = partsTotal + parseFloat(laborCost || "0");
  const quotationTotal = quotationItems.reduce((s, it) => {
    const p = it.part_id ? (allParts.find((ap: any) => ap.id === it.part_id)?.unit_price || 0) * (it.part_qty || 1) : 0;
    return s + it.labor + Number(p);
  }, 0);

  return (
    <Dialog open={!!job} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 border-none shadow-premium bg-card overflow-hidden rounded-4xl">
        <ScrollArea className="flex-1">
          <div className="p-8 space-y-8">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b pb-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                  <Bike className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-black tracking-tight uppercase leading-tight">
                    {job.booking?.motorcycle?.brand} {job.booking?.motorcycle?.model}
                  </DialogTitle>
                  <DialogDescription className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                    {job.booking?.motorcycle?.license_plate}
                    <Separator orientation="vertical" className="h-3" />
                    {job.booking?.customer?.full_name || "ลูกค้า"}
                  </DialogDescription>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-muted/50 border-none text-muted-foreground"
                  >
                    JOB #{job.id.slice(-8).toUpperCase()}
                  </Badge>
                  <Badge
                    className={cn(
                      "px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                      job.status === "in_progress"
                        ? "bg-blue-500/10 text-blue-600"
                        : job.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600",
                    )}
                  >
                    {job.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-xl border border-muted-foreground/10 min-w-[240px]">
                  <UserCheck className="w-4 h-4 text-primary opacity-60 ml-1" />
                  <Select value={assignedStaffId} onValueChange={handleAssignMechanic}>
                    <SelectTrigger className="h-9 border-none bg-transparent shadow-none font-bold text-xs uppercase tracking-widest focus:ring-0 px-0">
                      <SelectValue placeholder="ยังไม่ได้มอบหมายช่าง" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>
                        — เลือกช่าง —
                      </SelectItem>
                      {staffList.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* FR-21: Actual Start/End Date Display */}
            {(job.start_date || job.end_date) && (
              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-6 rounded-3xl border border-muted-foreground/5">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">วันเริ่มซ่อม (Actual Start)</p>
                  <p className="text-xs font-bold">
                    {job.start_date ? format(new Date(job.start_date), "dd MMM yyyy HH:mm", { locale: th }) : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">วันเสร็จสิ้น (Actual End)</p>
                  <p className="text-xs font-bold text-emerald-600">
                    {job.end_date ? format(new Date(job.end_date), "dd MMM yyyy HH:mm", { locale: th }) : "—"}
                  </p>
                </div>
              </div>
            )}

            {/* Main Tabs */}
            <Tabs defaultValue="estimate" className="space-y-8" onValueChange={(val: any) => setActiveTab(val)}>
              <TabsList className="grid grid-cols-4 h-14 p-1.5 bg-muted/40 rounded-2xl border border-muted-foreground/10">
                <TabsTrigger
                  value="estimate"
                  className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2 data-[state=active]:shadow-lg data-[state=active]:bg-background"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ใบประเมิน</span>
                  <span className="sm:hidden">ประเมิน</span>
                </TabsTrigger>
                <TabsTrigger
                  value="quotation"
                  className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2 data-[state=active]:shadow-lg data-[state=active]:bg-background"
                >
                  <FileSearch className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ใบเสนอราคา</span>
                  <span className="sm:hidden">เสนอราคา</span>
                </TabsTrigger>
                <TabsTrigger
                  value="parts"
                  className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2 data-[state=active]:shadow-lg data-[state=active]:bg-background"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">อะไหล่</span>
                  <span className="sm:hidden">อะไหล่</span>
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2 data-[state=active]:shadow-lg data-[state=active]:bg-background"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ชำระเงิน</span>
                  <span className="sm:hidden">จ่ายเงิน</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="estimate" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-amber-500" />
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">ใบประเมินราคาเบื้องต้น</h4>
                    </div>
                    {estimate?.status === "approved" && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest">
                        ✓ ลูกค้ายืนยันแล้ว
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                        รายละเอียดอาการ / แผนการซ่อม
                      </label>
                      <Textarea
                        placeholder="ระบุรายละเอียดเพื่อให้ลูกค้าทราบ..."
                        className="min-h-[120px] rounded-2xl bg-muted/20 border-none focus-visible:ring-primary/20 text-sm font-medium p-4"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                        ราคาประเมินเบื้องต้น (บาท)
                      </label>
                      <Input
                        type="number"
                        className="h-14 rounded-2xl bg-muted/20 border-none font-black text-xl text-amber-600 focus-visible:ring-amber-500/20 px-6"
                        value={estimatedCost}
                        onChange={(e) => setEstimatedCost(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                      onClick={handleSaveEstimate}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "บันทึกและส่งแจ้งเตือนลูกค้า"}
                    </Button>
                  </div>

                  {estimate && (
                    <Card className="border-none bg-muted/10 p-6 rounded-4xl">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-3">บันทึกล่าสุด</p>
                      <p className="text-sm font-bold mb-4">{estimate.description || "-"}</p>
                      <p className="text-2xl font-black text-amber-600">{formatCurrency(Number(estimate.estimated_cost))}</p>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="quotation" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSearch className="w-5 h-5 text-blue-500" />
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">ทำใบเสนอราคา (Quotation)</h4>
                    </div>
                    {existingQuotation && (
                      <Badge
                        className={cn(
                          "bg-blue-500/10 text-blue-600 border-none font-black text-[9px] uppercase tracking-widest",
                          existingQuotation.status === "approved" && "bg-emerald-500/10 text-emerald-600",
                          existingQuotation.status === "rejected" && "bg-rose-500/10 text-rose-600",
                        )}
                      >
                        สถานะ: {existingQuotation.status}
                      </Badge>
                    )}
                  </div>

                  <div className="bg-muted/10 p-6 rounded-4xl space-y-6 border border-muted-foreground/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">เพิ่มรายการซ่อม/อะไหล่</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        placeholder="รายการ เช่น ล้างโซ่, อัดจาระบี"
                        className="h-12 rounded-xl bg-background border-none focus-visible:ring-primary/20"
                        value={newQItem.description}
                        onChange={(e) =>
                          setNewQItem({
                            ...newQItem,
                            description: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="ค่าแรง (บาท)"
                        className="h-12 rounded-xl bg-background border-none focus-visible:ring-primary/20 font-bold"
                        value={newQItem.labor || ""}
                        onChange={(e) =>
                          setNewQItem({
                            ...newQItem,
                            labor: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <div className="sm:col-span-2 space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 px-1">
                          ค้นหาอะไหล่ (ระบุถ้ามี)
                        </label>
                        <Select value={newQItem.part_id} onValueChange={(val) => setNewQItem({ ...newQItem, part_id: val })}>
                          <SelectTrigger className="h-12 rounded-xl bg-background border-none focus:ring-0">
                            <SelectValue placeholder="พิมพ์ค้นหาหรือเลือกอะไหล่..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <div className="p-2 border-b bg-muted/20">
                              <Input
                                placeholder="ค้นหาชื่ออะไหล่..."
                                className="h-8 text-xs bg-background border-dashed"
                                onChange={(e) => {
                                  // Simple local filter logic could go here if we had a dedicated state,
                                  // but standard Select is tricky. For now, we'll keep it as a cleaner list.
                                }}
                              />
                            </div>
                            <SelectItem value="none">— ไม่ใช้อะไหล่ —</SelectItem>
                            {allParts.map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>
                                <div className="flex justify-between gap-4">
                                  <span>{p.name}</span>
                                  <span className="text-primary opacity-60 font-bold">{formatCurrency(p.unit_price)}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl border-dashed border-primary/20 text-primary font-bold hover:bg-primary/5"
                      onClick={handleAddQuotationItem}
                    >
                      <Plus className="w-4 h-4 mr-2" /> เพิ่มรายการ
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {quotationItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-muted-foreground/5 group hover:bg-muted/30 transition-colors"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-sm tracking-tight">{item.description}</p>
                          {item.part_id && (
                            <Badge
                              variant="secondary"
                              className="text-[8px] font-black uppercase tracking-widest bg-primary/5 text-primary"
                            >
                              ITEM + PARTS x{item.part_qty}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-6">
                          <p className="font-black text-blue-600 tracking-tight">{formatCurrency(item.labor)}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveQuotationItem(idx)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {quotationItems.length > 0 && (
                      <div className="p-6 rounded-4xl bg-blue-500/5 flex justify-between items-center mt-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600/60">รวมยอดเสนอราคา</p>
                        <p className="text-3xl font-black text-blue-600 tracking-tighter">{formatCurrency(quotationTotal)}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-6">
                    <Button
                      className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      onClick={handleSaveQuotation}
                      disabled={loading || quotationItems.length === 0}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ส่งใบเสนอราคาอย่างเป็นทางการ"}
                    </Button>
                    {existingQuotation && (
                      <ExportPDFButton
                        type="INVOICE"
                        job={job}
                        items={jobParts.map((pj: any) => ({
                          part: pj.part,
                          quantity: pj.quantity,
                          unit_price: pj.part.price,
                          price_total: pj.price_total,
                        }))}
                      />
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="parts" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-primary" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">รายการอะไหล่ที่ใช้จริง</h4>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 p-6 rounded-4xl bg-muted/10 border border-muted-foreground/5 items-end sm:items-center">
                    <div className="flex-1 w-full space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 px-1">
                        เลือกอะไหล่เพื่อลงบันทึกงานซ่อมจริง
                      </label>
                      <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                        <SelectTrigger className="h-14 rounded-xl bg-background border-none shadow-sm focus:ring-0">
                          <SelectValue placeholder="ค้นหาหรือเลือกอะไหล่..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[350px]">
                          {allParts.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex items-center justify-between w-full min-w-[320px] py-1">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-sm">{p.name}</span>
                                  <span className="text-[9px] uppercase tracking-widest opacity-40">Stock: {p.stock_qty} ยูนิต</span>
                                </div>
                                <span className="font-black text-primary text-base">{formatCurrency(p.unit_price)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="flex-1 sm:w-24 space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 px-1 text-center block">
                          จำนวน
                        </label>
                        <Input
                          type="number"
                          className="w-full h-14 rounded-xl bg-background border-none text-center font-black text-lg shadow-sm"
                          value={partQty}
                          onChange={(e) => setPartQty(parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <Button
                        className="h-14 w-14 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-95 transition-all mt-auto"
                        onClick={handleAddPart}
                        disabled={!selectedPartId || loading}
                      >
                        <Plus className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-4xl border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="text-[10px] font-bold uppercase px-8">อะไหล่</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase text-center">จำนวน</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase text-right px-8">รวม</TableHead>
                          <TableHead className="w-16" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobParts.map((pj: any) => (
                          <TableRow key={pj.id} className="group">
                            <TableCell className="px-8 font-bold">{pj.part.name}</TableCell>
                            <TableCell className="text-center font-bold text-muted-foreground">x{pj.quantity}</TableCell>
                            <TableCell className="text-right font-black text-primary px-8">
                              {formatCurrency(Number(pj.price_total))}
                            </TableCell>
                            <TableCell className="px-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-rose-500 opacity-0 group-hover:opacity-100"
                                onClick={() => handleRemovePart(pj.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {jobParts.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="h-32 text-center text-muted-foreground/40 font-bold uppercase tracking-widest text-[10px]"
                            >
                              ยังไม่มีรายการอะไหล่ในงานนี้
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                      <TableFooter className="bg-muted/30">
                        <TableRow>
                          <TableCell colSpan={2} className="px-8 text-[10px] font-black uppercase tracking-widest opacity-40">
                            รวมเฉพาะค่าอะไหล่
                          </TableCell>
                          <TableCell className="text-right font-black text-primary text-lg px-8">{formatCurrency(partsTotal)}</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                        ค่าแรงที่ใช้จริง (ตามประกาศร้าน)
                      </label>
                      <Input
                        type="number"
                        className="h-14 rounded-2xl bg-muted/20 border-none font-black text-xl text-primary focus-visible:ring-primary/20 px-6"
                        value={laborCost}
                        onChange={(e) => setLaborCost(e.target.value)}
                      />
                    </div>

                    <div className="p-8 rounded-4xl bg-indigo-500/5 border border-indigo-500/10 flex justify-between items-center group overflow-hidden relative">
                      <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                        <Wrench className="w-32 h-32 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600/60 mb-1">ยอดรวมงานซ่อมสุทธิ</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase opacity-40 tracking-widest">รวมอะไหล่และค่าแรง</p>
                      </div>
                      <p className="text-4xl font-black text-indigo-600 tracking-tighter">{formatCurrency(grandTotal)}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="payment" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-emerald-500" />
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">สรุปการเงินและชำระเงิน</h4>
                    </div>
                    {existingPayment && (
                      <Badge
                        className={cn(
                          "bg-amber-500/10 text-amber-600 border-none font-black text-[9px] uppercase tracking-widest",
                          existingPayment.status === "success" && "bg-emerald-500/10 text-emerald-600",
                        )}
                      >
                        {existingPayment.status === "success" ? "✓ ชำระแล้ว" : "รอยืนยันการชำระ"}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-6 border-none bg-muted/10 rounded-[1.5rem] text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">อะไหล่</p>
                      <p className="text-lg font-black tracking-tight">{formatCurrency(partsTotal)}</p>
                    </Card>
                    <Card className="p-6 border-none bg-muted/10 rounded-[1.5rem] text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">ค่าแรง</p>
                      <p className="text-lg font-black tracking-tight">{formatCurrency(parseFloat(laborCost || "0"))}</p>
                    </Card>
                    <Card className="p-6 border-none bg-emerald-500/5 rounded-[1.5rem] text-center ring-1 ring-emerald-500/20">
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/60 mb-2">รวมสุทธิ</p>
                      <p className="text-xl font-black text-emerald-600 tracking-tight">{formatCurrency(grandTotal)}</p>
                    </Card>
                  </div>

                  {existingPayment ? (
                    <div className="space-y-6">
                      <div className="bg-muted/10 p-6 rounded-[2rem] space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-muted-foreground/60 uppercase tracking-widest text-[10px]">ช่องทางชำระเงิน</span>
                          <span className="font-black">
                            {existingPayment.method === "CASH"
                              ? "💵 เงินสด"
                              : existingPayment.method === "TRANSFER"
                                ? "🏦 โอนเงิน"
                                : "📱 QR Transfer"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-muted-foreground/60 uppercase tracking-widest text-[10px]">ยอดเรียกเก็บ</span>
                          <span className="text-xl font-black text-emerald-600">{formatCurrency(Number(existingPayment.amount))}</span>
                        </div>
                      </div>

                      {existingPayment.slip_url && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <ImageIcon className="w-4 h-4 text-primary" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">สลิปหลักฐานการโอน</p>
                          </div>
                          <div className="relative aspect-[3/4] sm:aspect-[4/5] rounded-[2rem] overflow-hidden border bg-muted/10 group">
                            <img src={existingPayment.slip_url} alt="Slip" className="w-full h-full object-contain" />
                            <div className="absolute inset-x-0 bottom-0 p-6 bg-linear-to-t from-black/60 to-transparent flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="secondary"
                                className="rounded-xl font-bold text-xs"
                                onClick={() => window.open(existingPayment.slip_url, "_blank")}
                              >
                                ดูรูปภาพขนาดเต็ม
                              </Button>
                            </div>
                          </div>
                          {existingPayment.status === "pending" && (
                            <Button
                              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 mt-4"
                              onClick={handleConfirmPayment}
                              disabled={loading}
                            >
                              {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <BadgeCheck className="w-4 h-4 mr-2" /> ยืนยันยอดเงินและปิดบิล
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}

                      {existingPayment.status === "pending" && existingPayment.method === "CASH" && (
                        <Button
                          className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                          onClick={handleConfirmPayment}
                          disabled={loading}
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ยืนยันการรับเงินสด"}
                        </Button>
                      )}

                      {existingPayment.status === "success" && (
                        <div className="space-y-6">
                          <div className="p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-black text-emerald-600 tracking-tight">ชำระเงินเรียบร้อยแล้ว</p>
                              <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">
                                ระบบจะส่งมอบงานซ่อมโดยอัตโนมัติ
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <ExportPDFButton
                              type="RECEIPT"
                              job={job}
                              items={jobParts.map((pj: any) => ({
                                part: pj.part,
                                quantity: pj.quantity,
                                unit_price: pj.part.price,
                                price_total: pj.price_total,
                              }))}
                              payment={existingPayment}
                            />
                            <Button
                              variant="outline"
                              className="h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] border-none bg-muted hover:bg-muted/80"
                            >
                              <Receipt className="w-4 h-4 mr-2" /> ดูหน้าใบเสร็จ
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      {["completed", "delivered"].includes(job.status) ? (
                        !showPaymentForm ? (
                          <Button
                            className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                            onClick={() => setShowPaymentForm(true)}
                          >
                            🚀 สร้างใบเรียกเก็บเงิน
                          </Button>
                        ) : (
                          <div className="space-y-8 animate-in zoom-in-95 duration-300">
                            <div className="grid grid-cols-3 gap-4">
                              {(["CASH", "TRANSFER", "QR_TRANSFER"] as const).map((m) => (
                                <Button
                                  key={m}
                                  variant="outline"
                                  className={cn(
                                    "h-24 rounded-3xl flex flex-col items-center gap-2 border-none transition-all",
                                    paymentMethod === m ? "bg-emerald-500 text-white shadow-xl scale-105" : "bg-muted/30 hover:bg-muted/50",
                                  )}
                                  onClick={() => setPaymentMethod(m)}
                                >
                                  <span className="text-2xl">{m === "CASH" ? "💵" : m === "TRANSFER" ? "🏦" : "📱"}</span>
                                  <span className="text-[10px] font-black uppercase tracking-widest">
                                    {m === "CASH" ? "เงินสด" : m === "TRANSFER" ? "โอนเงิน" : "ผ่าย QR"}
                                  </span>
                                </Button>
                              ))}
                            </div>
                            <div className="flex gap-4">
                              <Button
                                variant="ghost"
                                className="flex-1 h-12 rounded-xl font-bold text-xs uppercase"
                                onClick={() => setShowPaymentForm(false)}
                              >
                                ยกเลิก
                              </Button>
                              <Button
                                className="flex-2 h-12 rounded-xl font-black uppercase tracking-widest text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                                onClick={handleCreatePayment}
                                disabled={loading}
                              >
                                สร้างบิลใหม่
                              </Button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="py-10 flex flex-col items-center gap-4 border-2 border-dashed rounded-[2rem] opacity-40">
                          <AlertCircle className="w-10 h-10" />
                          <p className="text-[10px] font-black uppercase tracking-widest max-w-[200px] leading-relaxed">
                            กรุณาระบุสถานะ "ซ่อมแล้ว" ก่อนทำการสร้างใบเรียกเก็บเงิน
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Action Footer */}
        <div className="p-8 border-t bg-muted/20 flex flex-col sm:flex-row gap-4 shrink-0">
          <div className="flex-1 flex gap-3">
            {job.status === "created" && (
              <Button
                className={cn(
                  "h-14 flex-1 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg",
                  job.customer_confirmed ? "bg-primary shadow-primary/20" : "bg-muted text-muted-foreground",
                )}
                disabled={loading || !job.customer_confirmed}
                onClick={() => handleUpdateJob("in_progress", 10)}
              >
                {job.customer_confirmed ? "▶ เริ่มดำเนินการซ่อม" : "⏳ รอลูกค้าอนุมัติ"}
              </Button>
            )}
            {job.status === "in_progress" && (
              <>
                <Button
                  variant="outline"
                  className="h-14 flex-1 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-background border-none shadow-sm"
                  onClick={() => handleUpdateJob(undefined, Math.min((job.progress || 0) + 20, 90))}
                  disabled={loading}
                >
                  +20% Progress
                </Button>
                <Button
                  className="h-14 flex-1 rounded-2xl font-black uppercase tracking-widest text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  onClick={() => handleUpdateJob("completed", 100)}
                  disabled={loading}
                >
                  ✓ ซ่อมเสร็จสมบูรณ์
                </Button>
              </>
            )}
            {job.status === "completed" && (
              <Button
                className="h-14 flex-1 rounded-2xl font-black uppercase tracking-widest text-xs bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                onClick={() => handleUpdateJob("delivered")}
                disabled={loading}
              >
                🚀 ส่งมอบรถให้ลูกค้า
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <ExportPDFButton
              type="REPORT"
              job={job}
              items={jobParts.map((pj: any) => ({
                part: pj.part,
                quantity: pj.quantity,
                unit_price: pj.part.price,
                price_total: pj.price_total,
              }))}
            />
            {existingQuotation && (
              <ExportPDFButton
                type="INVOICE"
                job={job}
                items={jobParts.map((pj: any) => ({
                  part: pj.part,
                  quantity: pj.quantity,
                  unit_price: pj.part.price,
                  price_total: pj.price_total,
                }))}
              />
            )}
            <Button
              variant="ghost"
              className="h-14 px-10 rounded-2xl font-bold text-xs uppercase hover:bg-destructive/5 hover:text-destructive"
              disabled={loading}
              onClick={onClose}
            >
              ปิดหน้าต่าง
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

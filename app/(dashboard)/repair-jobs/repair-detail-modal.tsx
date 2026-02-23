"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Trash2,
  Plus,
  Loader2,
  Wrench,
  Bike,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface RepairDetailModalProps {
  job: any | null;
  onClose: () => void;
}

export function RepairDetailModal({ job, onClose }: RepairDetailModalProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("0");
  const [laborCost, setLaborCost] = useState("0");
  const [selectedPartId, setSelectedPartId] = useState<string>("");
  const [partQty, setPartQty] = useState(1);

  // Fetch Estimate
  const { data: estimate, isLoading: isLoadingEstimate } = useQuery({
    queryKey: ["estimate", job?.booking_id],
    queryFn: async () => {
      if (!job) return null;
      const res = await fetch(`/api/staff/estimates/${job.booking_id}`);
      if (res.ok) return res.json();
      return null;
    },
    enabled: !!job,
  });

  // Fetch Job Parts
  const { data: jobParts = [], isLoading: isLoadingParts } = useQuery({
    queryKey: ["repair-parts", job?.id],
    queryFn: async () => {
      if (!job) return [];
      const res = await fetch(`/api/staff/repairs/${job.id}/parts`);
      return res.json();
    },
    enabled: !!job,
  });

  // Fetch All Parts for selection
  const { data: allParts = [] } = useQuery({
    queryKey: ["parts"],
    queryFn: async () => {
      const res = await fetch("/api/parts");
      return res.json();
    },
    enabled: !!job,
  });

  useEffect(() => {
    if (estimate) {
      setDescription(estimate.description);
      setEstimatedCost(estimate.estimated_cost.toString());
    }
    if (job) {
      setLaborCost(job.labor_cost.toString());
    }
  }, [estimate, job]);

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
        alert("บันทึกการประเมินราคาแล้ว");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
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
        body: JSON.stringify({
          part_id: selectedPartId,
          quantity: partQty,
        }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["repair-parts", job.id] });
        setSelectedPartId("");
        setPartQty(1);
      }
    } catch (err) {
      alert("เพิ่มอะไหล่ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePart = async (partItemId: string) => {
    if (!job) return;
    if (!confirm("ยืนยันการลบอะไหล่ชิ้นนี้?")) return;
    try {
      const res = await fetch(`/api/staff/repairs/parts/${partItemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["repair-parts", job.id] });
      }
    } catch (err) {
      alert("ลบไม่สำเร็จ");
    }
  };

  const handleUpdateJob = async (status?: string, progress?: number) => {
    if (!job) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/repairs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status || job.status,
          progress: progress !== undefined ? progress : job.progress,
          labor_cost: parseFloat(laborCost),
        }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["admin", "repairs"] });
        queryClient.invalidateQueries({ queryKey: ["repairs"] });
        if (status) onClose();
      }
    } catch (err) {
      alert("อัปเดตไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={!!job} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase">
                งานซ่อม #{job.id.slice(-8)}
              </DialogTitle>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] font-bold">
                  {job.status.toUpperCase()}
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {job.progress}%
                </Badge>
                {job.customer_confirmed ? (
                  <Badge
                    variant="success"
                    className="text-[10px] font-bold uppercase"
                  >
                    ลูกค้ากดยืนยันราคาแล้ว
                  </Badge>
                ) : job.booking.estimate ? (
                  <Badge
                    variant="warning"
                    className="text-[10px] font-bold uppercase"
                  >
                    รอการยืนยันจากลูกค้า
                  </Badge>
                ) : null}
                {job.payment?.status === "success" && (
                  <Badge
                    variant="success"
                    className="text-[10px] font-bold uppercase ring-2 ring-success/20 animate-pulse"
                  >
                    ชำระเงินแล้ว
                  </Badge>
                )}
                {job.payment?.status === "pending" && (
                  <Badge
                    variant="warning"
                    className="text-[10px] font-bold uppercase"
                  >
                    รอชำระเงิน
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Section 1: Info */}
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-3 h-3" /> ข้อมูลทั่วไป
              </h4>
              <div className="space-y-2">
                <p className="text-sm flex items-center gap-2 font-bold">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {job.booking.customer.full_name}
                </p>
                <p className="text-sm flex items-center gap-2 font-bold">
                  <Bike className="w-4 h-4 text-muted-foreground" />
                  {job.booking.motorcycle.brand} {job.booking.motorcycle.model}{" "}
                  ({job.booking.motorcycle.license_plate})
                </p>
                <p className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {format(new Date(job.booking.booking_time), "PPP HH:mm", {
                    locale: th,
                  })}
                </p>
              </div>
            </div>

            {/* Estimate Form */}
            <div className="space-y-4">
              {job.customer_confirmed ? (
                <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 border border-emerald-500/30 rounded-3xl relative overflow-hidden group shadow-lg shadow-emerald-500/10">
                  <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                    <CheckCircle2 className="w-24 h-24 text-emerald-600" />
                  </div>
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-emerald-700 dark:text-emerald-400 text-lg uppercase tracking-tight">
                        ลูกค้ากดยืนยันแล้ว!
                      </h4>
                      <p className="text-xs font-bold text-emerald-600/80 dark:text-emerald-400/60 uppercase tracking-widest leading-none mt-1">
                        ดำเนินการซ่อมได้ทันที
                      </p>
                    </div>
                  </div>
                </div>
              ) : job.booking.estimate ? (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                    กำลังรอการยืนยันจากลูกค้า...
                  </p>
                </div>
              ) : null}

              <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <Package className="w-3 h-3" /> การประเมินราคาเบื้องต้น
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase">
                      รายละเอียดอาการ/งานที่ควรทำ
                    </Label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="เช่น เปลี่ยนน้ำมันเครื่อง, เช็คระบบไฟ"
                      className="h-10 text-sm bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase">
                      ราคาประเมิน (บาท)
                    </Label>
                    <Input
                      type="number"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      className="h-10 text-sm bg-background/50 font-bold"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSaveEstimate}
                    disabled={loading}
                    className="w-full h-10 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-200 dark:shadow-none transition-all active:scale-95"
                    variant="warning"
                  >
                    {loading && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    บันทึกการประเมิน
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Parts & Labor */}
          <div className="space-y-4">
            <div className="p-4 border rounded-2xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Plus className="w-3 h-3" /> อะไหล่และค่าแรง (จริง)
              </h4>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={selectedPartId}
                      onValueChange={setSelectedPartId}
                    >
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue placeholder="เลือกอะไหล่..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allParts.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.price} ฿)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    className="w-20 h-10 rounded-xl"
                    value={partQty}
                    onChange={(e) => setPartQty(parseInt(e.target.value) || 1)}
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl"
                    onClick={handleAddPart}
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-[10px] h-8 px-3">
                          รายการ
                        </TableHead>
                        <TableHead className="text-[10px] h-8 px-3 text-right">
                          จำนวน
                        </TableHead>
                        <TableHead className="text-[10px] h-8 px-3 text-right">
                          รวม
                        </TableHead>
                        <TableHead className="text-[10px] h-8 px-3"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobParts.map((pj: any) => (
                        <TableRow key={pj.id}>
                          <TableCell className="text-xs py-2 px-3">
                            {pj.part.name}
                          </TableCell>
                          <TableCell className="text-xs py-2 px-3 text-right">
                            x{pj.quantity}
                          </TableCell>
                          <TableCell className="text-xs py-2 px-3 text-right font-bold">
                            {pj.price_total} ฿
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right">
                            <button
                              onClick={() => handleRemovePart(pj.id)}
                              className="text-destructive hover:scale-110 transition-transform"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {jobParts.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-[10px] text-center py-4 text-muted-foreground"
                          >
                            ยังไม่มีอะไหล่
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label className="text-[10px] uppercase">ค่าแรง (บาท)</Label>
                  <Input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="h-10 text-sm font-bold bg-primary/5 border-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 sm:justify-between gap-4">
          <div className="flex-1 flex items-center justify-between gap-4">
            <div className="flex gap-2 flex-1">
              {job.status === "created" && (
                <Button
                  variant="default"
                  className="rounded-xl font-bold flex-1"
                  onClick={() => {
                    if (!job.customer_confirmed) {
                      alert("กรุณารอให้ลูกค้ายืนยันราคาก่อนเริ่มงานซ่อม");
                      return;
                    }
                    handleUpdateJob("in_progress", 10);
                  }}
                  disabled={loading || !job.customer_confirmed}
                >
                  {job.customer_confirmed ? "เริ่มซ่อม" : "รอลูกค้ายืนยัน"}
                </Button>
              )}
              {job.status === "in_progress" && (
                <Button
                  variant="success"
                  className="rounded-xl font-bold flex-1"
                  onClick={() => handleUpdateJob("completed", 100)}
                  disabled={loading}
                >
                  ซ่อมเสร็จสิ้น
                </Button>
              )}
              {job.status === "completed" && (
                <Button
                  variant="default"
                  className="rounded-xl font-bold flex-1 bg-amber-600 hover:bg-amber-700"
                  onClick={() => {
                    if (confirm("ส่งมอบรถและสร้างรายการชำระเงิน?")) {
                      handleUpdateJob("delivered", 100);
                    }
                  }}
                  disabled={loading}
                >
                  ส่งมอบรถ/แจ้งชำระเงิน
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {["created", "in_progress"].includes(job.status) && (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl font-bold"
                  onClick={() => {
                    if (confirm("ยืนยันยกเลิกงานซ่อมนี้?")) {
                      handleUpdateJob("cancelled", 0);
                    }
                  }}
                  disabled={loading}
                >
                  ยกเลิกงาน
                </Button>
              )}
              <Button
                variant="outline"
                className="rounded-xl px-6"
                onClick={() => handleUpdateJob()}
                disabled={loading}
              >
                บันทึกข้อมูล
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

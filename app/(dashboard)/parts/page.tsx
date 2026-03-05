"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Archive,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  User,
  Wrench,
  Camera,
  MoreVertical,
  Minus,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { partSchema, type PartInput } from "@/lib/validations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageUpload } from "@/components/ui/image-upload";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ReportExportButton } from "@/components/pdf/report-export-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// --- Sub-component: Inventory Logs Modal ---
function InventoryLogsDialog({
  partId,
  open,
  onOpenChange,
}: {
  partId: string | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["inventory-logs", partId],
    queryFn: async () => {
      const res = await fetch(`/api/staff/inventory/logs?part_id=${partId || ""}&limit=20`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-premium">
        <DialogHeader className="p-8 pb-4 shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <History className="w-7 h-7" />
            </div>
            <div>
              <DialogTitle className="font-black text-2xl tracking-tight uppercase">
                {partId ? "ประวัติสต็อกอะไหล่" : "ประวัติสต็อกทั้งหมด"}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-1">
                Inventory Activity Logs (Last 20 entries)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="flex-1 p-8">
          {isLoading ? (
            <div className="py-24 text-center border bg-muted/10 rounded-4xl border-dashed flex flex-col items-center gap-6">
              <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Loading history...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs italic">No activity recorded</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log: any) => (
                <div
                  key={log.id}
                  className="p-6 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                          log.type === "RESTOCK" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600",
                        )}
                      >
                        {log.type === "RESTOCK" ? <Plus className="w-6 h-6" /> : <Minus className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-black text-sm uppercase tracking-tight">
                            {log.type === "RESTOCK" ? "เพิ่มสต็อก" : "ใช้งานอะไหล่"}
                          </p>
                          <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                            {format(new Date(log.created_at), "dd MMM HH:mm", {
                              locale: th,
                            })}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground line-clamp-1 italic">"{log.reason || "ไม่ระบุหมายเหตุ"}"</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn("text-xl font-black tracking-tighter", log.type === "RESTOCK" ? "text-emerald-500" : "text-rose-500")}
                      >
                        {log.type === "RESTOCK" ? "+" : "-"}
                        {log.quantity}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">PCS</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Page Component ---
export default function PartsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [viewLogPartId, setViewLogPartId] = useState<string | null | undefined>(undefined);

  const [formData, setFormData] = useState<PartInput>({
    name: "",
    description: "",
    price: 0,
    stock_qty: 0,
    min_stock: 5,
    image_url: "",
  });

  const { data: parts = [], isLoading } = useQuery<any[]>({
    queryKey: ["parts", searchTerm],
    queryFn: async () => {
      const res = await fetch(`/api/staff/inventory?search=${searchTerm}`);
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PartInput) => {
      const url = editingPart ? `/api/staff/inventory/${editingPart.id}` : "/api/staff/inventory";
      const method = editingPart ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Something went wrong");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(editingPart ? "อัปเดตข้อมูลอะไหล่แล้ว" : "เพิ่มอะไหล่ใหม่สำเร็จ");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/staff/inventory/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Could not delete");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("ลบรายการอะไหล่เรียบร้อย");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const openAddModal = () => {
    setEditingPart(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      stock_qty: 0,
      min_stock: 5,
      image_url: "",
    });
    setIsModalOpen(true);
  };

  const startEdit = (part: any) => {
    setEditingPart(part);
    setFormData({
      name: part.name,
      description: part.description || "",
      price: Number(part.price),
      stock_qty: part.stock_qty,
      min_stock: part.min_stock || 0,
      image_url: part.image_url || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPart(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = partSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    mutation.mutate(formData);
  };

  const handleDelete = (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) {
      deleteMutation.mutate(id);
    }
  };

  const stats = {
    totalItems: parts.length,
    lowStockCount: parts.filter((p) => p.stock_qty < (p.min_stock || 5)).length,
    totalValue: parts.reduce((acc, p) => acc + Number(p.price) * p.stock_qty, 0),
  };

  return (
    <div className="animate-fluid pb-20 max-w-7xl mx-auto">
      <TopBar title="คลังอะไหล่" subtitle="จัดการสต็อกอะไหล่ ประวัติการใช้งาน และการจัดซื้อ" />

      <div className="px-6 space-y-10 mt-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-white/5 shadow-premium bg-card/40 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden rounded-4xl">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center transition-transform group-hover:scale-110 shadow-md">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">จำนวนรายการทั้งหมด</p>
                <p className="text-3xl font-black tracking-tighter text-sky-500">{stats.totalItems.toLocaleString()}</p>
                <p className="text-[9px] font-bold text-muted-foreground opacity-60">รายการอะไหล่ในระบบ</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-4xl border-none shadow-premium bg-card/50 overflow-hidden group">
            <CardContent className="p-8 flex items-center gap-6">
              <div
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg",
                  stats.lowStockCount > 0
                    ? "bg-amber-500/10 text-amber-600 shadow-amber-500/10"
                    : "bg-slate-500/10 text-slate-500 shadow-slate-500/5",
                )}
              >
                {stats.lowStockCount > 0 ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">สินค้าที่ต้องสั่งเพิ่ม</p>
                <p className={cn("text-3xl font-black tracking-tighter", stats.lowStockCount > 0 ? "text-amber-600" : "text-slate-500")}>
                  {stats.lowStockCount.toLocaleString()}
                </p>
                <p className="text-[9px] font-bold text-muted-foreground opacity-60">รายการที่ใกล้หมด</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-4xl border border-white/5 shadow-premium bg-emerald-500/5 backdrop-blur-md overflow-hidden group">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110 shadow-md">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">มูลค่ารวมในสต็อก</p>
                <p className="text-3xl font-black tracking-tighter text-emerald-600">{formatCurrency(stats.totalValue)}</p>
                <p className="text-[9px] font-bold text-muted-foreground opacity-60">คำนวณจากราคาต้นทุน/ขาย</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-2">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <Input
              placeholder="ค้นหาชื่ออะไหล่ หรือรหัส..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-none bg-card shadow-sm font-bold uppercase text-xs tracking-widest placeholder:opacity-30"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <ReportExportButton type="STOCK" data={parts} stats={stats} />
            <Button
              onClick={() => setViewLogPartId(null)}
              variant="outline"
              className="h-14 w-14 rounded-2xl border-none bg-card shadow-sm hover:text-primary transition-all p-0"
              title="ดูประวัติการเคลื่อนไหวสต็อก"
            >
              <History className="w-5 h-5" />
            </Button>
            <Button
              onClick={openAddModal}
              className="h-14 px-8 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-md transition-all hover:scale-105 active:scale-95 flex-1 md:flex-none"
            >
              <Plus className="w-4 h-4 mr-3" strokeWidth={3} />
              เพิ่มอะไหล่ใหม่
            </Button>
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[450px] rounded-[2.5rem]" />)
          ) : parts.length === 0 ? (
            <div className="col-span-full py-40 text-center border-none rounded-[3rem] bg-muted/10">
              <Archive className="w-20 h-20 mx-auto mb-8 opacity-5" />
              <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-xs opacity-40 italic">
                {searchTerm ? "ไม่พบข้อมูลอะไหล่ที่ค้นหา" : "ไม่มีข้อมูลในคลังอะไหล่ขณะนี้"}
              </p>
            </div>
          ) : (
            parts.map((p: any) => {
              const isLowStock = p.stock_qty < (p.min_stock || 5);
              return (
                <Card
                  key={p.id}
                  className="rounded-[2.5rem] border border-white/5 shadow-premium bg-card/40 backdrop-blur-md overflow-hidden group hover:shadow-xl transition-all duration-500"
                >
                  <CardContent className="p-0">
                    {/* Header / Image Area */}
                    <div className="relative aspect-16/10 overflow-hidden bg-muted/20">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/20 italic">
                          <Package className="w-16 h-16 mb-2 opacity-5" />
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-20">NO VISUAL RESOURCE</span>
                        </div>
                      )}

                      {/* Actions Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                        <Button
                          variant="secondary"
                          className="w-12 h-12 rounded-xl bg-white/90 hover:bg-white text-primary p-0 shadow-xl"
                          onClick={() => startEdit(p)}
                        >
                          <Edit2 className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="secondary"
                          className="w-12 h-12 rounded-xl bg-white/90 hover:bg-white text-rose-500 p-0 shadow-xl"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="secondary"
                          className="w-12 h-12 rounded-xl bg-white/90 hover:bg-white text-foreground p-0 shadow-xl"
                          onClick={() => setViewLogPartId(p.id)}
                        >
                          <History className="w-5 h-5" />
                        </Button>
                      </div>

                      {isLowStock && (
                        <Badge className="absolute top-6 left-6 bg-rose-500 hover:bg-rose-500 text-white animate-pulse border-none px-3 py-1 font-black uppercase text-[8px] tracking-widest">
                          Low Stock Alert
                        </Badge>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="p-10 space-y-8">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="font-black text-xl tracking-tight uppercase line-clamp-1 group-hover:text-primary transition-colors">
                            {p.name}
                          </h4>
                          <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest bg-muted h-fit px-2 py-1 rounded-sm shrink-0">
                            #{p.id.slice(-6).toUpperCase()}
                          </p>
                        </div>
                        <p className="text-[11px] font-bold text-muted-foreground/60 leading-relaxed italic line-clamp-2">
                          {p.description || "No description provided for this component."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-muted/50">
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.15em] mb-2">ราคาขาย</p>
                          <p className="text-3xl font-black text-emerald-600 tracking-tighter">{formatCurrency(Number(p.price))}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.15em] mb-2">คงเหลือ</p>
                          <div className="flex items-baseline justify-end gap-2">
                            <p className={cn("text-3xl font-black tracking-tighter", isLowStock ? "text-rose-500" : "text-foreground")}>
                              {p.stock_qty.toLocaleString("th-TH")}
                            </p>
                            <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">
                              / {p.min_stock || 0} PCS
                            </span>
                          </div>
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

      {/* Part Modal (Add/Edit) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-premium p-0 bg-card">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="p-10 pb-6 shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
                  {editingPart ? <Edit2 className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                </div>
                <div>
                  <DialogTitle className="font-black text-2xl tracking-tight uppercase">
                    {editingPart ? "แก้ไขข้อมูลอะไหล่" : "เพิ่มอะไหล่ใหม่"}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-1">
                    Inventory Component Resource Record
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Separator />

            <div className="p-10 space-y-8">
              {/* Image Upload Area */}
              <div className="bg-muted/30 rounded-3xl p-6">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-4">รูปภาพประกอบ</Label>
                <ImageUpload value={formData.image_url || ""} onChange={(url) => setFormData({ ...formData, image_url: url })} />
              </div>

              <div className="space-y-6">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">ชื่ออะไหล่ / อุปกรณ์</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-14 rounded-2xl border-none bg-muted/30 font-bold text-sm focus-visible:ring-primary shadow-inner"
                    placeholder="e.g. ผ้าเบรคปั๊มบน 8.1"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">รายละเอียด</Label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="rounded-2xl border-none bg-muted/30 font-bold text-sm focus-visible:ring-primary shadow-inner min-h-[100px]"
                    placeholder="ข้อมูลเพิ่มเติม เช่น รุ่นที่รองรับ หรือเกรดวัสดุ..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">ราคาขาย</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      required
                      value={formData.price === 0 && !editingPart ? "" : formData.price}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                          setFormData({ ...formData, price: val === "" ? 0 : Number(val) });
                        }
                      }}
                      className="h-14 rounded-2xl border-none bg-muted/30 font-black text-center text-lg focus-visible:ring-primary shadow-inner"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">สต็อกปัจจุบัน</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formData.stock_qty === 0 && !editingPart ? "" : formData.stock_qty}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^[0-9]*$/.test(val)) {
                          setFormData({ ...formData, stock_qty: val === "" ? 0 : Number(val) });
                        }
                      }}
                      className="h-14 rounded-2xl border-none bg-muted/30 font-black text-center text-lg focus-visible:ring-primary shadow-inner"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">จุดเตือนสต็อกต่ำ</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formData.min_stock === 0 && !editingPart ? "" : formData.min_stock}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^[0-9]*$/.test(val)) {
                          setFormData({ ...formData, min_stock: val === "" ? 0 : Number(val) });
                        }
                      }}
                      className="h-14 rounded-2xl border-none bg-muted/30 font-black text-center text-lg focus-visible:ring-primary shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <DialogFooter className="p-10 pt-6 flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={closeModal}
                className="h-14 flex-1 rounded-2xl font-bold uppercase text-xs tracking-widest"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                className="h-14 flex-1 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : editingPart ? "บันทึกการแก้ไข" : "ยืนยันเพิ่มอะไหล่"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <InventoryLogsDialog
        open={viewLogPartId !== undefined}
        onOpenChange={(open) => !open && setViewLogPartId(undefined)}
        partId={viewLogPartId}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { Plus, Bike, Trash2, AlertCircle, Loader2, CheckCircle2, XCircle, AlertTriangle, Camera, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motorcycleSchema, type MotorcycleInput } from "@/lib/validations";
import { ImageUpload } from "@/components/ui/image-upload";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Motorcycle {
  id: string;
  brand: string;
  model: string;
  license_plate: string;
  year: number | null;
  image_url: string | null;
}

export default function MotorcyclesPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MotorcycleInput>({
    brand: "",
    model: "",
    license_plate: "",
    year: undefined,
    image_url: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: motorcycles = [], isLoading } = useQuery<Motorcycle[]>({
    queryKey: ["motorcycles"],
    queryFn: async () => {
      const res = await fetch("/api/motorcycles");
      if (!res.ok) throw new Error("Failed to fetch motorcycles");
      return res.json();
    },
  });

  const createMotorcycle = useMutation({
    mutationFn: async (data: MotorcycleInput) => {
      const res = await fetch("/api/motorcycles", {
        method: "POST",
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
      queryClient.invalidateQueries({ queryKey: ["motorcycles"] });
      setShowAddForm(false);
      resetForm();
      toast.success("เพิ่มข้อมูลรถเรียบร้อยแล้ว");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const updateMotorcycle = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MotorcycleInput }) => {
      const res = await fetch(`/api/motorcycles/${id}`, {
        method: "PATCH",
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
      queryClient.invalidateQueries({ queryKey: ["motorcycles"] });
      setShowAddForm(false);
      setEditingId(null);
      resetForm();
      toast.success("อัปเดตข้อมูลรถเรียบร้อยแล้ว");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const resetForm = () => {
    setForm({
      brand: "",
      model: "",
      license_plate: "",
      year: undefined,
      image_url: "",
    });
    setEditingId(null);
    setErrors({});
  };

  const deleteMotorcycle = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/motorcycles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motorcycles"] });
      toast.success("ลบข้อมูลรถเรียบร้อยแล้ว");
    },
    onError: () => {
      toast.error("ไม่สามารถลบข้อมูลได้");
    },
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = motorcycleSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: any = {};
      parsed.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (editingId) {
      updateMotorcycle.mutate({ id: editingId, data: parsed.data });
    } else {
      createMotorcycle.mutate(parsed.data);
    }
  };

  const handleEditClick = (m: Motorcycle) => {
    setEditingId(m.id);
    setForm({
      brand: m.brand,
      model: m.model,
      license_plate: m.license_plate,
      year: m.year || undefined,
      image_url: m.image_url || "",
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const doDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    deleteMotorcycle.mutate(id);
  };

  return (
    <div className="animate-fluid pb-20 max-w-7xl mx-auto">
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl font-bold">ยืนยันการลบข้อมูล</DialogTitle>
            <DialogDescription>คุณต้องการลบข้อมูลรถคันนี้ออกจากระบบใช่ไหม? การกระทำนี้ไม่สามารถย้อนคืนได้</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="rounded-xl">
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={doDelete} className="rounded-xl font-bold">
              ยืนยันลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TopBar title="รถจักรยานยนต์" subtitle="จัดการและติดตามข้อมูลรถของคุณ" />

      <div className="px-6 space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-tight">รถของฉัน ({motorcycles.length})</h3>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">ข้อมูลรถที่ลงทะเบียนไว้ในระบบ</p>
          </div>
          <Button
            onClick={() => {
              if (showAddForm) resetForm();
              setShowAddForm(!showAddForm);
            }}
            className="h-11 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 active-prime transition-transform"
          >
            {showAddForm ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? "ยกเลิก" : "เพิ่มรถคันใหม่"}
          </Button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <Card className="border-none shadow-premium overflow-hidden animate-in slide-in-from-top-4 duration-500">
            <CardHeader className="bg-muted/30 pb-6 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-wider">
                {editingId ? "แก้ไขข้อมูลรถ" : "เพิ่มข้อมูลรถใหม่"}
              </CardTitle>
              <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
                {editingId ? "ปรับปรุงรายละเอียดรถของคุณ" : "ระบุรายละเอียดและอัปโหลดรูปภาพรถของคุณ"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleFormSubmit} className="space-y-10">
                <div className="flex flex-col lg:flex-row gap-12">
                  <div className="space-y-4 shrink-0">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">รูปถ่ายรถ</Label>
                    <ImageUpload
                      value={form.image_url || ""}
                      onChange={(url) => setForm({ ...form, image_url: url })}
                      folder="motorcycles"
                    />
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">ยี่ห้อรถ</Label>
                      <Input
                        placeholder="เช่น Honda, Yamaha"
                        className="h-12 bg-muted/30 border-none font-bold focus-visible:ring-primary/40 rounded-xl px-4"
                        value={form.brand}
                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      />
                      {errors.brand && (
                        <p className="text-[10px] text-destructive font-bold uppercase tracking-wider px-1">{errors.brand}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">รุ่นรถ</Label>
                      <Input
                        placeholder="เช่น PCX 160"
                        className="h-12 bg-muted/30 border-none font-bold focus-visible:ring-primary/40 rounded-xl px-4"
                        value={form.model}
                        onChange={(e) => setForm({ ...form, model: e.target.value })}
                      />
                      {errors.model && (
                        <p className="text-[10px] text-destructive font-bold uppercase tracking-wider px-1">{errors.model}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">เลขทะเบียน</Label>
                      <Input
                        placeholder="1กข 1234 กทม."
                        className="h-12 bg-muted/30 border-none font-bold focus-visible:ring-primary/40 rounded-xl px-4"
                        value={form.license_plate}
                        onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
                      />
                      {errors.license_plate && (
                        <p className="text-[10px] text-destructive font-bold uppercase tracking-wider px-1">{errors.license_plate}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">ปีที่จดทะเบียน</Label>
                      <Input
                        type="number"
                        placeholder="เช่น 2566"
                        className="h-12 bg-muted/30 border-none font-bold focus-visible:ring-primary/40 rounded-xl px-4"
                        value={form.year?.toString() || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            year: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                      {errors.year && <p className="text-[10px] text-destructive font-bold uppercase tracking-wider px-1">{errors.year}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-8 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-xs"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMotorcycle.isPending || updateMotorcycle.isPending}
                    className="h-12 min-w-[200px] rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/20"
                  >
                    {createMotorcycle.isPending || updateMotorcycle.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingId ? (
                      "บันทึกการแก้ไข"
                    ) : (
                      "บันทึกข้อมูลรถ"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-3xl" />
            ))}
          </div>
        ) : motorcycles.length === 0 ? (
          <div className="py-24 text-center border bg-muted/10 rounded-[2.5rem] border-dashed flex flex-col items-center gap-8">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center opacity-20">
              <Bike className="w-10 h-10" />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-bold opacity-30 uppercase tracking-[0.25em]">ยังไม่มีข้อมูลรถจักรยานยนต์ของคุณ</p>
              <Button
                variant="link"
                className="text-primary font-black uppercase tracking-[0.2em] text-[10px]"
                onClick={() => setShowAddForm(true)}
              >
                ลงทะเบียนรถคันแรกเลย
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            {motorcycles.map((m: Motorcycle) => (
              <Card
                key={m.id}
                className="group border-none shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden rounded-4xl bg-card animate-in fade-in slide-in-from-bottom-4"
              >
                <div className="relative h-60 overflow-hidden bg-muted/30">
                  {m.image_url ? (
                    <img
                      src={m.image_url}
                      alt={`${m.brand} ${m.model}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30">
                      <Bike className="w-16 h-16" strokeWidth={1.5} />
                      <span className="text-[8px] font-bold uppercase tracking-[0.4em] mt-4 opacity-50">ไม่มีข้อมูลรูปภาพ</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      type="button"
                      size="icon"
                      className="h-9 w-9 rounded-xl shadow-lg bg-white/90 hover:bg-white text-primary opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300"
                      onClick={() => handleEditClick(m)}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300"
                      onClick={() => setDeleteId(m.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-xl font-black tracking-tight leading-tight uppercase line-clamp-1">
                        {m.brand} {m.model}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="bg-primary/5 text-primary border-none rounded-lg px-2 py-0.5 text-[10px] font-black tracking-widest uppercase"
                      >
                        {m.license_plate}
                      </Badge>
                    </div>

                    <Separator className="opacity-40" />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.2em]">ปีที่จดทะเบียน</p>
                        <p className="text-sm font-black">{m.year || "ไม่ระบุ"}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground/20 group-hover:text-primary transition-colors">
                        <Bike className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

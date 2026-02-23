"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ImagePlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { partSchema, type PartInput } from "@/lib/validations";
import { ImageUpload } from "@/components/ui/image-upload";

export default function PartsPage() {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<PartInput>({
    name: "",
    description: "",
    price: 0,
    stock_qty: 0,
    image_url: "",
  });

  const fetchParts = async () => {
    try {
      const res = await fetch(`/api/parts?search=${search}`);
      if (res.ok) setParts(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchParts(), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = partSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId ? `/api/parts/${editingId}` : "/api/parts";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setForm({
          name: "",
          description: "",
          price: 0,
          stock_qty: 0,
          image_url: "",
        });
        fetchParts();
      } else {
        const data = await res.json();
        setError(data.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (part: any) => {
    setEditingId(part.id);
    setForm({
      name: part.name,
      description: part.description || "",
      price: Number(part.price),
      stock_qty: part.stock_qty,
      image_url: part.image_url || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบอะไหล่นี้จากระบบ?")) return;
    try {
      const res = await fetch(`/api/parts/${id}`, { method: "DELETE" });
      if (res.ok) fetchParts();
    } catch (err) {
      alert("ลบไม่สำเร็จ");
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      <TopBar
        title="คลังอะไหล่"
        subtitle="หน้าสำหรับจัดการสต็อกและราคาอะไหล่ (สำหรับเจ้าหน้าที่)"
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats Header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="bg-primary/5 border-primary/10 rounded-3xl overflow-hidden accent-glow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <Archive className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                  ทั้งหมดในคลัง
                </p>
                <p className="text-2xl font-black">
                  {parts.length.toLocaleString()} รายการ
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-warning/5 border-warning/10 rounded-3xl overflow-hidden accent-glow-wa">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-warning/10 text-warning flex items-center justify-center shadow-inner">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                  สินค้าใกล้หมด
                </p>
                <p className="text-2xl font-black text-warning">
                  {parts.filter((p) => p.stock_qty < 5).length.toLocaleString()}{" "}
                  รายการ
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-success/5 border-success/10 rounded-3xl overflow-hidden accent-glow-su">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-success/10 text-success flex items-center justify-center shadow-inner">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                  มูลค่ารวมในสต็อก
                </p>
                <p className="text-2xl font-black text-success">
                  {formatCurrency(
                    parts.reduce(
                      (s, p) => s + Number(p.price) * p.stock_qty,
                      0,
                    ),
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-3xl border border-border/40 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อหรือรหัสอะไหล่..."
              className="pl-11 h-12 rounded-2xl bg-muted/20 border-transparent focus:bg-background transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setForm({
                name: "",
                description: "",
                price: 0,
                stock_qty: 0,
                image_url: "",
              });
            }}
            className="gap-2 shrink-0 h-12 rounded-2xl px-6 font-black uppercase text-xs tracking-widest"
          >
            <Plus className="w-4 h-4" />
            เพิ่มอะไหล่ใหม่
          </Button>
        </div>

        {showForm && (
          <Card className="border-primary/20 bg-primary/5 rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  {editingId ? "แก้ไขข้อมูลอะไหล่" : "เพิ่มอะไหล่เข้าคลัง"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                      รูปภาพอะไหล่
                    </label>
                    <ImageUpload
                      value={form.image_url}
                      onChange={(url) => setForm({ ...form, image_url: url })}
                      folder="parts"
                    />
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="ชื่ออะไหล่"
                      placeholder="เช่น หัวเทียน NGK, น้ำมันเครื่อง Shell"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                    <Input
                      label="ราคาขาย (บาท)"
                      type="number"
                      placeholder="0.00"
                      value={form.price.toString()}
                      onChange={(e) =>
                        setForm({ ...form, price: Number(e.target.value) })
                      }
                    />
                    <Input
                      label="จำนวนในสต็อกคงเหลือ"
                      type="number"
                      placeholder="0"
                      value={form.stock_qty.toString()}
                      onChange={(e) =>
                        setForm({ ...form, stock_qty: Number(e.target.value) })
                      }
                    />
                    <Input
                      label="รายละเอียดเพิ่มเติม / คำอธิบาย"
                      placeholder="ระบุรุ่นที่รองรับ หรือคุณสมบัติ"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-4 rounded-2xl border border-destructive/20 font-bold">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-primary/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl font-bold"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    loading={submitting}
                    className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20"
                  >
                    {editingId ? "บันทึกการแก้ไข" : "ยืนยันเพิ่มอะไหล่"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                กำลังโหลดสต็อกอะไหล่...
              </p>
            </div>
          ) : parts.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-[3rem] bg-muted/10 border-border">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p className="text-muted-foreground font-bold">
                ไม่มีข้อมูลอะไหล่ที่ค้นหา
              </p>
            </div>
          ) : (
            parts.map((p) => (
              <div
                key={p.id}
                className="card bg-card border border-border/40 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group rounded-[2.5rem]"
              >
                <figure className="relative h-48 overflow-hidden bg-muted">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 bg-linear-to-br from-muted/50 to-muted group-hover:bg-primary/5 transition-colors">
                      <Package className="w-14 h-14 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        No Image
                      </span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 bg-white/80 backdrop-blur-md rounded-xl text-primary hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                      onClick={() => startEdit(p)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 bg-destructive/10 backdrop-blur-md rounded-xl text-destructive hover:bg-destructive shadow-lg hover:text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 delay-75"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </figure>

                <div className="card-body p-7 space-y-4">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h2 className="card-title text-lg font-black text-foreground leading-tight truncate">
                        {p.name}
                      </h2>
                      {p.stock_qty < 5 && (
                        <Badge
                          variant="destructive"
                          className="animate-pulse text-[9px] uppercase font-bold shrink-0"
                        >
                          Low Stock
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 font-medium">
                      {p.description || "-"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                        ราคาขาย
                      </p>
                      <p className="text-xl font-black text-primary">
                        {formatCurrency(Number(p.price))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                        คงเหลือ
                      </p>
                      <div className="flex items-baseline justify-end gap-1">
                        <span
                          className={cn(
                            "text-xl font-black",
                            p.stock_qty < 5
                              ? "text-destructive"
                              : "text-foreground",
                          )}
                        >
                          {p.stock_qty.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          UNIT
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

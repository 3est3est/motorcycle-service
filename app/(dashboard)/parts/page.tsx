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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { partSchema, type PartInput } from "@/lib/validations";

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
        setForm({ name: "", description: "", price: 0, stock_qty: 0 });
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">
                  ทั้งหมด
                </p>
                <p className="text-xl font-bold">{parts.length} รายการ</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-warning/5 border-warning/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">
                  ใกล้หมด
                </p>
                <p className="text-xl font-bold">
                  {parts.filter((p) => p.stock_qty < 5).length} รายการ
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-success/5 border-success/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">
                  มูลค่ารวม
                </p>
                <p className="text-xl font-bold">
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

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่ออะไหล่..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setForm({ name: "", description: "", price: 0, stock_qty: 0 });
            }}
            className="gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            เพิ่มอะไหล่ใหม่
          </Button>
        </div>

        {showForm && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="ชื่ออะไหล่"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <Input
                    label="ราคาขาย (บาท)"
                    type="number"
                    value={form.price.toString()}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
                  />
                  <Input
                    label="จำนวนในสต็อก"
                    type="number"
                    value={form.stock_qty.toString()}
                    onChange={(e) =>
                      setForm({ ...form, stock_qty: Number(e.target.value) })
                    }
                  />
                  <Input
                    label="ลายละเอียด"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit" loading={submitting}>
                    {editingId ? "อัปเดตข้อมูล" : "สร้างรายการใหม่"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                กำลังโหลดสต็อกอะไหล่...
              </p>
            </div>
          ) : parts.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-10" />
              <p className="text-muted-foreground">ไม่มีข้อมูลอะไหล่ที่ค้นหา</p>
            </div>
          ) : (
            parts.map((p) => (
              <Card
                key={p.id}
                className="group hover:border-primary/50 transition-all overflow-hidden"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-bold text-foreground truncate">
                        {p.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {p.description || "-"}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => startEdit(p)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        ราคา
                      </p>
                      <p className="text-lg font-black text-primary">
                        {formatCurrency(Number(p.price))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        ในสต็อก
                      </p>
                      <p
                        className={`text-lg font-black ${p.stock_qty < 5 ? "text-destructive" : "text-foreground"}`}
                      >
                        {p.stock_qty.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          ชิ้น
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

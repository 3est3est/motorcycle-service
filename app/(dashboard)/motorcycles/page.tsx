"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Bike,
  Trash2,
  AlertCircle,
  Loader2,
  ImagePlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motorcycleSchema, type MotorcycleInput } from "@/lib/validations";
import { ImageUpload } from "@/components/ui/image-upload";

interface Motorcycle {
  id: string;
  brand: string;
  model: string;
  license_plate: string;
  year: number | null;
  image_url: string | null;
}

export default function MotorcyclesPage() {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<MotorcycleInput>({
    brand: "",
    model: "",
    license_plate: "",
    year: undefined,
    image_url: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const fetchMotorcycles = async () => {
    try {
      const res = await fetch("/api/motorcycles");
      if (res.ok) {
        const data = await res.json();
        setMotorcycles(data);
      }
    } catch (error) {
      console.error("Failed to fetch motorcycles", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotorcycles();
  }, []);

  const handleAddMotorcycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    // Validate with Zod
    const parsed = motorcycleSchema.safeParse({
      ...form,
      year: form.year ? Number(form.year) : undefined,
    });

    if (!parsed.success) {
      const fieldErrors: any = {};
      parsed.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/motorcycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (res.ok) {
        setShowAddForm(false);
        setForm({
          brand: "",
          model: "",
          license_plate: "",
          year: undefined,
          image_url: "",
        });
        setErrors({});
        fetchMotorcycles();
      } else {
        const data = await res.json();
        setServerError(data.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      setServerError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบรถคันนี้?")) return;

    try {
      const res = await fetch(`/api/motorcycles/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMotorcycles(motorcycles.filter((m) => m.id !== id));
      }
    } catch (error) {
      alert("ลบข้อมูลไม่สำเร็จ");
    }
  };

  return (
    <div className="animate-fade-in">
      <TopBar
        title="รถจักรยานยนต์"
        subtitle="จัดการข้อมูลรถจักรยานยนต์ของคุณ"
      />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-foreground">
            รถของคุณ ({motorcycles.length})
          </h3>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-2 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            เพิ่มรถใหม่
          </Button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <Card className="border-primary/20 bg-primary/5 rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8">
              <form onSubmit={handleAddMotorcycle} className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                      รูปภาพรถจักรยานยนต์
                    </label>
                    <ImageUpload
                      value={form.image_url}
                      onChange={(url) => setForm({ ...form, image_url: url })}
                      folder="motorcycles"
                    />
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                      label="ยี่ห้อ"
                      placeholder="เช่น Honda, Yamaha"
                      value={form.brand}
                      onChange={(e) =>
                        setForm({ ...form, brand: e.target.value })
                      }
                      error={errors.brand}
                    />
                    <Input
                      label="รุ่นรถ"
                      placeholder="เช่น PCX 160"
                      value={form.model}
                      onChange={(e) =>
                        setForm({ ...form, model: e.target.value })
                      }
                      error={errors.model}
                    />
                    <Input
                      label="เลขทะเบียน"
                      placeholder="1กข 1234 กทม."
                      value={form.license_plate}
                      onChange={(e) =>
                        setForm({ ...form, license_plate: e.target.value })
                      }
                      error={errors.license_plate}
                    />
                    <Input
                      label="ปีที่จดทะเบียน (พ.ศ.)"
                      type="number"
                      placeholder="เช่น 2566"
                      value={form.year?.toString() || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          year: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      error={errors.year}
                    />
                  </div>
                </div>

                {serverError && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-4 rounded-2xl border border-destructive/20 font-bold">
                    <AlertCircle className="w-4 h-4" />
                    {serverError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddForm(false)}
                    className="rounded-xl font-bold"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    loading={submitting}
                    className="rounded-xl font-bold px-8"
                  >
                    บันทึกข้อมูลรถคันนี้
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="font-bold uppercase tracking-widest text-[10px]">
              กำลังโหลดข้อมูล...
            </p>
          </div>
        ) : motorcycles.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-[3rem] bg-muted/20">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Bike className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-bold">
              ยังไม่มีข้อมูลรถจักรยานยนต์
            </p>
            <Button
              variant="link"
              onClick={() => setShowAddForm(true)}
              className="text-primary font-bold"
            >
              เพิ่มคันแรกเลยตอนนี้
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {motorcycles.map((m) => (
              <div
                key={m.id}
                className="card bg-card border border-border/40 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group rounded-[2.5rem]"
              >
                <figure className="relative h-48 overflow-hidden bg-muted">
                  {m.image_url ? (
                    <img
                      src={m.image_url}
                      alt={`${m.brand} ${m.model}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 bg-linear-to-br from-muted/50 to-muted group-hover:bg-primary/5 transition-colors">
                      <Bike className="w-16 h-16 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        No Photos attached
                      </span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </figure>
                <div className="card-body p-7">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="card-title text-xl font-black text-foreground">
                        {m.brand} {m.model}
                      </h2>
                      <div className="badge badge-primary badge-outline font-black text-[10px] mt-2 uppercase tracking-widest py-3">
                        {m.license_plate}
                      </div>
                    </div>
                  </div>

                  <div className="divider opacity-10 my-1" />

                  <div className="flex justify-between items-center text-xs">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground font-bold uppercase tracking-tighter text-[9px]">
                        Registered Year
                      </span>
                      <span className="font-black text-foreground text-sm">
                        {m.year || "N/A"}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
                      <Bike className="w-5 h-5 text-primary opacity-40" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

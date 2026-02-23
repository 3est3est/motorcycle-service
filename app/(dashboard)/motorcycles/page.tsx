"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Bike, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motorcycleSchema, type MotorcycleInput } from "@/lib/validations";

interface Motorcycle {
  id: string;
  brand: string;
  model: string;
  license_plate: string;
  year: number | null;
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
  });
  const [errors, setErrors] = useState<Partial<MotorcycleInput>>({});
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
        setForm({ brand: "", model: "", license_plate: "", year: undefined });
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
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            เพิ่มรถใหม่
          </Button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <form onSubmit={handleAddMotorcycle} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {serverError && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    {serverError}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddForm(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit" loading={submitting}>
                    บันทึกข้อมูล
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
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        ) : motorcycles.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-muted/20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Bike className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">ยังไม่มีข้อมูลรถจักรยานยนต์</p>
            <Button variant="link" onClick={() => setShowAddForm(true)}>
              เพิ่มคันแรกเลย
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {motorcycles.map((m) => (
              <Card
                key={m.id}
                className="overflow-hidden group hover:border-primary/50 transition-all"
              >
                <CardContent className="p-0">
                  <div className="p-5 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Bike className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">
                          {m.brand} {m.model}
                        </h4>
                        <p className="text-xs text-muted-foreground uppercase font-medium mt-1">
                          {m.license_plate}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-muted/30 px-5 py-3 border-t border-border flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      ปีที่จดทะเบียน:
                    </span>
                    <span className="font-medium text-foreground">
                      {m.year || "ไม่ระบุ"}
                    </span>
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

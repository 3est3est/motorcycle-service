"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Phone,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    phone: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setForm(data);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-muted-foreground">กำลังโหลดข้อมูลโปรไฟล์...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      <TopBar
        title="ตั้งค่าบัญชี"
        subtitle="จัดการข้อมูลส่วนตัวและความปลอดภัยของคุณ"
      />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">ข้อมูลส่วนตัว</CardTitle>
                  <CardDescription>
                    ข้อมูลที่ใช้ในการติดต่อและการออกใบเสร็จ
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  บันทึกข้อมูลเรียบร้อยแล้ว
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    อีเมล (ไม่สามารถเปลี่ยนได้)
                  </label>
                  <Input
                    value={form.email}
                    disabled
                    className="bg-muted/50 border-border/50"
                  />
                </div>

                <Input
                  label="ชื่อ-นามสกุล"
                  name="full_name"
                  value={form.full_name}
                  placeholder="เช่น สมชาย ใจดี"
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                  icon={<User className="w-4 h-4" />}
                />

                <Input
                  label="เบอร์โทรศัพท์"
                  name="phone"
                  value={form.phone}
                  placeholder="08xxxxxxxx"
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  icon={<Phone className="w-4 h-4" />}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="gap-2 min-w-[140px]"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {submitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm opacity-60">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted-foreground/10 text-muted-foreground">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">ความปลอดภัย</CardTitle>
                  <CardDescription>
                    จัดการรหัสผ่านของคุณ (Coming Soon)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
                  <Input label="รหัสผ่านเดิม" type="password" disabled />
                  <Input label="รหัสผ่านใหม่" type="password" disabled />
                </div>
                <Button variant="outline" disabled className="gap-2">
                  <Lock className="w-4 h-4" />
                  เปลี่ยนรหัสผ่าน
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

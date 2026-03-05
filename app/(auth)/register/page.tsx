"use client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, UserPlus, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { registerSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { z } from "zod";

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name as keyof RegisterForm]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const getPasswordStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strengthConfig = [
    { label: "", color: "" },
    { label: "อ่อนมาก", color: "bg-destructive" },
    { label: "อ่อน", color: "bg-warning" },
    { label: "ปานกลาง", color: "bg-yellow-400" },
    { label: "แข็งแกร่ง", color: "bg-success" },
  ];
  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof RegisterForm, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterForm;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message ?? "เกิดข้อผิดพลาด");
        return;
      }

      setSuccess(true);
    } catch {
      setServerError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto border border-success/20">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">สมัครสมาชิกสำเร็จ!</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          กรุณาตรวจสอบอีเมล <span className="font-medium text-foreground">{form.email}</span> และกดลิงก์ยืนยันก่อนเข้าสู่ระบบ
        </p>
        <Link href="/login" className="block w-full">
          <Button className="mt-2 w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            เข้าสู่ระบบ
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">สมัครสมาชิก</h2>
        <p className="text-sm text-muted-foreground mt-1">สร้างบัญชีเพื่อเริ่มใช้งานระบบจัดการซ่อมรถ</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {serverError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{serverError}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 w-full">
            <Label htmlFor="full_name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
              ชื่อ-นามสกุล
            </Label>
            <Input
              id="full_name"
              name="full_name"
              placeholder="สมชาย ใจดี"
              className={cn(
                "h-12 rounded-2xl bg-muted/50 border-none outline-none ring-offset-background transition-premium font-bold text-sm w-full px-6",
                errors.full_name && "ring-2 ring-destructive/20",
              )}
              value={form.full_name}
              onChange={handleChange}
              autoComplete="name"
              autoFocus
            />
            {errors.full_name && (
              <p className="text-[10px] text-destructive font-black uppercase tracking-tight px-1">{errors.full_name}</p>
            )}
          </div>

          <div className="space-y-2 w-full">
            <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
              เบอร์โทรศัพท์
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="0812345678"
              className={cn(
                "h-12 rounded-2xl bg-muted/50 border-none outline-none ring-offset-background transition-premium font-bold text-sm w-full px-6",
                errors.phone && "ring-2 ring-destructive/20",
              )}
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
            />
            {errors.phone && <p className="text-[10px] text-destructive font-black uppercase tracking-tight px-1">{errors.phone}</p>}
          </div>
        </div>

        <div className="space-y-2 w-full">
          <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
            อีเมลผู้ใช้งาน
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            className={cn(
              "h-12 rounded-2xl bg-muted/50 border-none outline-none ring-offset-background transition-premium font-bold text-sm w-full px-6",
              errors.email && "ring-2 ring-destructive/20",
            )}
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />
          {errors.email && <p className="text-[10px] text-destructive font-black uppercase tracking-tight px-1">{errors.email}</p>}
        </div>

        <div className="space-y-2 w-full relative group">
          <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
            รหัสผ่าน
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="อย่างน้อย 8 ตัวอักษร"
              className={cn(
                "h-12 rounded-2xl bg-muted/50 border-none outline-none ring-offset-background transition-premium font-bold text-sm w-full px-6",
                errors.password && "ring-2 ring-destructive/20",
              )}
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-[10px] text-destructive font-black uppercase tracking-tight px-1">{errors.password}</p>}
        </div>

        {/* Password strength */}
        {form.password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthConfig[strength].color : "bg-base-200"}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              ความปลอดภัย: <span className="font-medium">{strengthConfig[strength].label}</span>
            </p>
          </div>
        )}

        <div className="space-y-2 w-full">
          <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
            ยืนยันรหัสผ่าน
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            className={cn(
              "h-12 rounded-2xl bg-muted/50 border-none outline-none ring-offset-background transition-premium font-bold text-sm w-full px-6",
              errors.confirmPassword && "ring-2 ring-destructive/20",
            )}
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p className="text-[10px] text-destructive font-black uppercase tracking-tight px-1">{errors.confirmPassword}</p>
          )}
        </div>

        <div className="pt-2">
          <div className="pt-2 space-y-2 w-full">
            <Label htmlFor="inviteCode" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
              รหัสเชิญชวน (สำหรับพนักงาน/แอดมิน)
            </Label>
            <Input
              id="inviteCode"
              name="inviteCode"
              placeholder="เว้นว่างไว้หากเป็นลูกค้า"
              className={cn(
                "h-12 rounded-2xl bg-muted/50 border-none outline-none ring-offset-background transition-premium font-bold text-sm w-full px-6",
                errors.inviteCode && "ring-2 ring-destructive/20",
              )}
              value={form.inviteCode || ""}
              onChange={handleChange}
            />
            <p className="text-[10px] text-muted-foreground/40 mt-1 px-1 font-bold uppercase tracking-tight">
              * หากเป็นพนักงานหรือแอดมิน กรุณากรอกรหัสลับที่ได้รับจากเจ้าของร้าน
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all gap-3"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              สมัครสมาชิก
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        มีบัญชีแล้ว?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}

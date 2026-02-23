"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, UserPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerSchema } from "@/lib/validations";
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
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterForm, string>>
  >({});
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
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          สมัครสมาชิกสำเร็จ!
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          กรุณาตรวจสอบอีเมล{" "}
          <span className="font-medium text-foreground">{form.email}</span>{" "}
          และกดลิงก์ยืนยันก่อนเข้าสู่ระบบ
        </p>
        <Link href="/login">
          <Button className="mt-2 w-full">เข้าสู่ระบบ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">สมัครสมาชิก</h2>
        <p className="text-sm text-muted-foreground mt-1">
          สร้างบัญชีเพื่อเริ่มใช้งานระบบจัดการซ่อมรถ
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {serverError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {serverError}
          </div>
        )}

        <Input
          id="full_name"
          name="full_name"
          label="ชื่อ-นามสกุล"
          placeholder="สมชาย ใจดี"
          value={form.full_name}
          onChange={handleChange}
          error={errors.full_name}
          autoComplete="name"
          autoFocus
        />

        <Input
          id="phone"
          name="phone"
          type="tel"
          label="เบอร์โทรศัพท์"
          placeholder="0812345678"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          autoComplete="tel"
        />

        <Input
          id="email"
          name="email"
          type="email"
          label="อีเมล"
          placeholder="your@email.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />

        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            label="รหัสผ่าน"
            placeholder="อย่างน้อย 8 ตัวอักษร"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-8 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Password strength */}
        {form.password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= strength ? strengthConfig[strength].color : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              ความปลอดภัย:{" "}
              <span className="font-medium">
                {strengthConfig[strength].label}
              </span>
            </p>
          </div>
        )}

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="ยืนยันรหัสผ่าน"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <div className="pt-2">
          <Input
            id="inviteCode"
            name="inviteCode"
            label="รหัสเชิญชวน (สำหรับพนักงาน/แอดมิน)"
            placeholder="เว้นว่างไว้หากเป็นลูกค้า"
            value={form.inviteCode}
            onChange={handleChange}
            error={errors.inviteCode}
          />
          <p className="text-[10px] text-muted-foreground mt-1 px-1">
            * หากเป็นพนักงานหรือแอดมิน กรุณากรอกรหัสลับที่ได้รับจากเจ้าของร้าน
          </p>
        </div>

        <Button
          type="submit"
          className="w-full gap-2"
          loading={loading}
          disabled={loading}
        >
          <UserPlus className="w-4 h-4" />
          สมัครสมาชิก
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        มีบัญชีแล้ว?{" "}
        <Link
          href="/login"
          className="text-primary font-medium hover:underline"
        >
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}

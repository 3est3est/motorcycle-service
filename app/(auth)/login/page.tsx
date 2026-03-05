"use client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginInput>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginInput>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name as keyof LoginInput]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<LoginInput> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginInput;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message ?? "เกิดข้อผิดพลาด");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fluid">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0 pb-8">
          <CardTitle className="text-3xl font-black tracking-tight">
            เข้าสู่ระบบ
          </CardTitle>
          <CardDescription className="text-sm font-medium">
            ยินดีต้อนรับกลับมา! กรุณากรอกข้อมูลเพื่อเข้าสู่บัญชีของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {serverError && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center gap-3">
                <AlertCircle className="w-4 h-4" />
                {serverError}
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >
                อีเมล
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="yours@example.com"
                className={cn(
                  "h-12 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-muted/50 transition-premium px-4 font-bold text-sm",
                  errors.email && "ring-2 ring-destructive/20",
                )}
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <p className="text-[10px] text-destructive font-bold uppercase tracking-wider">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2 relative">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                >
                  รหัสผ่าน
                </Label>
                <Link
                  href="#"
                  className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn(
                    "h-12 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-muted/50 transition-premium px-4 font-bold text-sm",
                    errors.password && "ring-2 ring-destructive/20",
                  )}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1 text-muted-foreground hover:text-foreground h-10 w-10"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-[10px] text-destructive font-bold uppercase tracking-wider">
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 active-prime"
              disabled={loading}
            >
              {loading ? (
                "กำลังดำเนินการ..."
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  เข้าสู่ระบบ
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="px-0 pt-6 flex justify-center">
          <p className="text-xs font-medium text-muted-foreground">
            ยังไม่มีบัญชี?{" "}
            <Link
              href="/register"
              className="text-primary font-bold hover:underline"
            >
              สมัครสมาชิก
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

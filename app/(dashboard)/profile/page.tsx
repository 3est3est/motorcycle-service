"use client";
import { useState } from "react";

import { TopBar } from "@/components/layout/topbar";
import { User, Phone, Mail, Lock, Loader2, Save, ShieldCheck, CircleUserRound, IdCard, Camera } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageUpload } from "@/components/ui/image-upload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const { data: form = { email: "", full_name: "", phone: "", image_url: "" }, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setImageUrl(data.image_url || "");
      return data;
    },
  });

  const [imageUrl, setImageUrl] = useState("");

  const updateProfile = useMutation({
    mutationFn: async (updatedData: { full_name: string; phone: string; image_url: string }) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateProfile.mutate({
      full_name: formData.get("full_name") as string,
      phone: formData.get("phone") as string,
      image_url: imageUrl,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card className="rounded-[2.5rem] border-none shadow-sm">
          <CardHeader className="p-10">
            <Skeleton className="h-12 w-12 rounded-2xl" />
          </CardHeader>
          <CardContent className="p-10 pt-0 space-y-10">
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
            </div>
            <Skeleton className="h-14 w-40 rounded-2xl ml-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fluid pb-20 max-w-4xl mx-auto">
      <TopBar title="โปรไฟล์" subtitle="จัดการข้อมูลส่วนตัวและความปลอดภัย" />

      <div className="px-6 space-y-10 mt-8">
        <form onSubmit={handleSubmit} className="space-y-10">
          <Card className="rounded-[2.5rem] border-none shadow-premium overflow-hidden bg-card/50">
            <CardHeader className="p-10 pb-8 bg-muted/20 border-b">
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden bg-primary/5 ring-4 ring-background shadow-premium transition-transform group-hover:scale-[1.02]">
                    <ImageUpload value={imageUrl} onChange={setImageUrl} folder="profiles" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-4 border-background pointer-events-none group-hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <CardTitle className="text-2xl font-black uppercase tracking-tight">ข้อมูลส่วนตัว</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mt-1">
                    ข้อมูลนี้จะถูกใช้ในการติดต่อและออกใบเสร็จรับเงิน
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 px-1 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> อีเมลส่วนตัว (แก้ไขไม่ได้)
                  </Label>
                  <Input
                    defaultValue={form.email}
                    disabled
                    className="h-14 rounded-2xl bg-muted/30 border-none font-bold text-sm opacity-50 cursor-not-allowed px-6"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 px-1 flex items-center gap-2">
                    <IdCard className="w-3.5 h-3.5" /> ชื่อ-นามสกุล
                  </Label>
                  <Input
                    name="full_name"
                    defaultValue={form.full_name}
                    placeholder="ระบุชื่อ-นามสกุลจริง"
                    className="h-14 rounded-2xl bg-muted/10 border-none focus-visible:ring-primary/20 transition-all font-bold text-sm px-6"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 px-1 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> เบอร์โทรศัพท์มือถือ
                  </Label>
                  <Input
                    name="phone"
                    defaultValue={form.phone}
                    placeholder="08xxxxxxxx"
                    className="h-14 rounded-2xl bg-muted/10 border-none focus-visible:ring-primary/20 transition-all font-bold text-sm px-6"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-8 border-t">
                <Button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-3" strokeWidth={2.5} />
                      บันทึกการเปลี่ยนแปลง
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-sm opacity-60 bg-muted/10 group transition-all hover:opacity-100">
            <CardHeader className="p-10 border-b">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight">ความปลอดภัย</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mt-1">
                    ระบบการเปลี่ยนรหัสผ่าน (กำลังพัฒนา)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10 pointer-events-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3 opacity-40">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-1">รหัสผ่านปัจจุบัน</Label>
                  <Input type="password" disabled className="h-14 rounded-2xl bg-muted border-none" />
                </div>
                <div className="space-y-3 opacity-40">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-1">รหัสผ่านใหม่</Label>
                  <Input type="password" disabled className="h-14 rounded-2xl bg-muted border-none" />
                </div>
              </div>
              <Button
                disabled
                className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-muted text-muted-foreground border-none"
              >
                <Lock className="w-4 h-4 mr-3" />
                อัปเดตรหัสผ่านใหม่
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

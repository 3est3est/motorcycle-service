"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import {
  Users,
  ShieldCheck,
  Wrench,
  User as UserIcon,
  Loader2,
  Search,
  MoreVertical,
  Check,
  Mail,
  Phone,
  AlertCircle,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  History,
  IdCard,
  Star,
  Plus,
  Minus,
  Briefcase,
  LayoutGrid,
  CircleUserRound,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/lib/hooks/use-profile";
import { useRealtime } from "@/components/providers/realtime-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface UserProfile {
  id: string;
  email: string;
  role: "customer" | "staff" | "admin";
  created_at: string;
  customer?: {
    full_name: string;
    phone: string;
    image_url?: string;
    loyalty_points?: {
      total_points: number;
    };
  };
}

const roleConfig = {
  customer: {
    label: "ลูกค้า",
    icon: UserIcon,
    color: "bg-pink-500/15 text-pink-600",
    activeColor: "bg-pink-500/25 text-pink-700",
    loyalty: true,
  },
  staff: {
    label: "พนักงาน",
    icon: Wrench,
    color: "bg-sky-500/15 text-sky-600",
    activeColor: "bg-sky-500/25 text-sky-700",
    loyalty: false,
  },
  admin: {
    label: "ผู้ดูแลระบบ",
    icon: ShieldCheck,
    color: "bg-violet-500/15 text-violet-600",
    activeColor: "bg-violet-500/25 text-violet-700",
    loyalty: false,
  },
};

export default function UsersManagementPage() {
  const queryClient = useQueryClient();
  const { onlineUsers } = useRealtime();
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    userId: string;
    newRole: string;
    label: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "customer" | "staff" | "admin">("all");

  const [pointsDialog, setPointsDialog] = useState<{
    userId: string;
    userName: string;
    currentPoints: number;
  } | null>(null);
  const [pointAdjust, setPointAdjust] = useState({ amount: "", type: "earn" as "earn" | "redeem" | "adjust" });

  const { data: users = [], isLoading } = useQuery<UserProfile[]>({
    queryKey: ["users", search],
    queryFn: async () => {
      const res = await fetch(`/api/staff/users?search=${search}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const res = await fetch(`/api/staff/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update role");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("อัปเดตบทบาทผู้ใช้เรียบร้อยแล้ว");
      setConfirmDialog(null);
      setUpdatingId(null);
    },
    onError: (err: any) => {
      toast.error(err.message);
      setConfirmDialog(null);
      setUpdatingId(null);
    },
    onMutate: (vars) => {
      setUpdatingId(vars.userId);
    },
  });

  const adjustPoints = useMutation({
    mutationFn: async ({ userId, amount, type }: { userId: string; amount: number; type: string }) => {
      const res = await fetch(`/api/staff/users/${userId}/points`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, type }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to adjust points");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("ปรับปรุงแต้มสะสมเรียบร้อยแล้ว");
      setPointsDialog(null);
      setPointAdjust({ amount: "", type: "earn" });
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const { data: profile } = useProfile();
  const currentUserRole = profile?.role;

  const handleRoleChangeRequest = (userId: string, newRole: string) => {
    if (currentUserRole !== "admin") {
      toast.error("คุณไม่มีสิทธิ์ในการเปลี่ยนบทบาทผู้ใช้");
      return;
    }

    const roleLabels: Record<string, string> = {
      customer: "ลูกค้า (Customer)",
      staff: "พนักงานซ่อม (Staff)",
      admin: "ผู้ดูแลระบบสูงสุด (Admin)",
    };
    setConfirmDialog({
      userId,
      newRole,
      label: roleLabels[newRole] || newRole,
    });
  };

  const confirmRoleUpdate = () => {
    if (!confirmDialog) return;
    updateRole.mutate({
      userId: confirmDialog.userId,
      newRole: confirmDialog.newRole,
    });
  };

  const handleAdjustSubmit = () => {
    if (!pointsDialog || !pointAdjust.amount) return;
    adjustPoints.mutate({
      userId: pointsDialog.userId,
      amount: parseInt(pointAdjust.amount),
      type: pointAdjust.type,
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="animate-fluid pb-20 max-w-7xl mx-auto">
      <TopBar title="จัดการระบบ" subtitle="ตรวจสอบบัญชีผู้ใช้และมอบหมายสิทธิ์เข้าใช้งาน" />

      <div className="px-6 space-y-10 mt-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
          <div className="flex gap-4">
            <Card className="rounded-3xl border border-white/5 bg-indigo-500/5 backdrop-blur-md p-6 flex items-center gap-6 min-w-[240px] shadow-premium">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-md">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500/60 mb-1">ผู้ใช้ทั้งหมด</p>
                <p className="text-3xl font-black tracking-tighter text-indigo-500">{users.length}</p>
              </div>
            </Card>
          </div>

          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-all duration-300" />
            <Input
              placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
              className="h-16 pl-14 rounded-4xl bg-muted/30 border-none font-black text-sm uppercase tracking-widest focus-visible:ring-primary/20 shadow-inner group-hover:bg-muted/40 transition-all placeholder:text-muted-foreground/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Tab */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">หมวดหมู่สมาชิก</h4>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={activeTab === "all" ? "default" : "ghost"}
              className={cn(
                "h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-premium",
                activeTab === "all" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted/30 hover:bg-muted/50",
              )}
              onClick={() => setActiveTab("all")}
            >
              <LayoutGrid className="w-4 h-4 mr-2" /> ทั้งหมด
            </Button>
            <Button
              variant={activeTab === "customer" ? "default" : "ghost"}
              className={cn(
                "h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-premium",
                activeTab === "customer"
                  ? "bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/20"
                  : "bg-muted/30 hover:bg-muted/50 text-pink-600",
              )}
              onClick={() => setActiveTab("customer")}
            >
              <UserIcon className="w-4 h-4 mr-2" /> ลูกค้า
            </Button>
            <Button
              variant={activeTab === "staff" ? "default" : "ghost"}
              className={cn(
                "h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-premium",
                activeTab === "staff"
                  ? "bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20"
                  : "bg-muted/30 hover:bg-muted/50 text-sky-600",
              )}
              onClick={() => setActiveTab("staff")}
            >
              <Wrench className="w-4 h-4 mr-2" /> พนักงาน
            </Button>
            <Button
              variant={activeTab === "admin" ? "default" : "ghost"}
              className={cn(
                "h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-premium",
                activeTab === "admin"
                  ? "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20"
                  : "bg-muted/30 hover:bg-muted/50 text-violet-600",
              )}
              onClick={() => setActiveTab("admin")}
            >
              <ShieldCheck className="w-4 h-4 mr-2" /> แอดมิน
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse-fast">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64 rounded-4xl bg-muted/20" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="py-24 text-center border bg-muted/10 rounded-4xl border-dashed flex flex-col items-center gap-6">
              <Users className="w-16 h-16 mx-auto mb-6 opacity-5" />
              <p className="text-muted-foreground font-bold uppercase tracking-[0.25em] text-xs opacity-40">ไม่พบข้อมูลรายชื่อผู้ใช้</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {users
                .filter((u) => activeTab === "all" || u.role === activeTab)
                .map((user) => {
                  const config = roleConfig[user.role] || roleConfig.customer;
                  const isUpdating = updatingId === user.id;
                  const points = user.customer?.loyalty_points?.total_points || 0;

                  return (
                    <Card
                      key={user.id}
                      className={cn(
                        "border border-white/5 shadow-premium bg-card/40 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden rounded-4xl",
                        isUpdating && "opacity-50 pointer-events-none grayscale",
                      )}
                    >
                      <CardContent className="p-10">
                        <div className="flex flex-col sm:flex-row gap-8 items-start justify-between">
                          <div className="flex gap-8 items-center flex-1 min-w-0">
                            <Avatar className="w-24 h-24 rounded-4xl border-none shadow-premium ring-2 ring-background overflow-hidden bg-muted/20">
                              <AvatarImage src={user.customer?.image_url} className="object-cover" />
                              <AvatarFallback className="bg-primary/5 text-primary/40">
                                <CircleUserRound strokeWidth={1.5} className="w-12 h-12" />
                              </AvatarFallback>
                            </Avatar>

                            <div className="space-y-3 flex-1 min-w-0">
                              <div className="flex items-center gap-4 flex-wrap">
                                <h3 className="text-2xl font-black tracking-tight uppercase truncate leading-tight group-hover:text-primary transition-colors">
                                  {user.customer?.full_name || "GUEST ACCOUNT"}
                                </h3>
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-3 py-1 border-none shadow-sm",
                                    config.color,
                                  )}
                                >
                                  {config.label}
                                </Badge>
                              </div>
                              <div className="flex flex-col gap-2">
                                <button
                                  className="w-fit flex items-center gap-2.5 text-sm font-bold text-muted-foreground hover:text-primary transition-all group/mail"
                                  onClick={() => {
                                    navigator.clipboard.writeText(user.email);
                                    toast.info("คัดลอกอีเมลลงคลิปบอร์ดแล้ว");
                                  }}
                                >
                                  <div className="p-1.5 rounded-lg bg-muted/40 group-hover/mail:bg-primary/10 group-hover/mail:text-primary transition-all">
                                    <Mail className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="opacity-70 group-hover/mail:opacity-100">{user.email}</span>
                                </button>
                                {user.customer?.phone && (
                                  <div className="flex items-center gap-2.5 text-sm font-bold text-muted-foreground">
                                    <div className="p-1.5 rounded-lg bg-muted/40">
                                      <Phone className="w-3.5 h-3.5 opacity-60 text-emerald-500" />
                                    </div>
                                    <span className="opacity-60">{user.customer.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-12 w-12 rounded-2xl bg-muted/40 hover:bg-muted/60 transition-premium active:scale-90"
                                >
                                  <MoreVertical className="w-5 h-5 opacity-40" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-64 p-3 rounded-4xl shadow-premium border-none bg-card animate-in fade-in zoom-in-95 duration-200"
                              >
                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-4 py-3">
                                  จัดการสิทธิ์และคะแนน
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {user.role === "customer" && (
                                  <>
                                    <DropdownMenuItem
                                      className="p-4 rounded-2xl cursor-pointer text-amber-600 bg-amber-500/5 mb-2 focus:bg-amber-500/10 transition-colors"
                                      onClick={() =>
                                        setPointsDialog({
                                          userId: user.id,
                                          userName: user.customer?.full_name || user.email,
                                          currentPoints: points,
                                        })
                                      }
                                    >
                                      <div className="flex items-center gap-3 font-black text-[11px] uppercase tracking-widest">
                                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> ปรับปรุงแต้มสะสม
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem
                                  className="p-4 rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => handleRoleChangeRequest(user.id, "customer")}
                                >
                                  <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-3 font-bold text-xs uppercase">
                                      <UserIcon className="w-4 h-4 opacity-40" /> ลูกค้าทั่วไป
                                    </div>
                                    {user.role === "customer" && <Check className="w-4 h-4 text-emerald-500" />}
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="p-4 rounded-2xl cursor-pointer hover:bg-amber-50/50 transition-colors"
                                  onClick={() => handleRoleChangeRequest(user.id, "staff")}
                                >
                                  <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-3 font-bold text-xs uppercase text-amber-600">
                                      <Wrench className="w-4 h-4 opacity-40" /> พนักงานเทคนิค
                                    </div>
                                    {user.role === "staff" && <Check className="w-4 h-4 text-emerald-500" />}
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="p-4 rounded-2xl cursor-pointer hover:bg-indigo-50/50 transition-colors"
                                  onClick={() => handleRoleChangeRequest(user.id, "admin")}
                                >
                                  <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-3 font-bold text-xs uppercase text-indigo-600">
                                      <ShieldCheck className="w-4 h-4 opacity-40" /> ผู้ดูแลร่วมสรุป
                                    </div>
                                    {user.role === "admin" && <Check className="w-4 h-4 text-emerald-500" />}
                                  </div>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {user.role === "customer" && (
                              <div className="bg-amber-500/15 px-6 py-4 rounded-3xl border border-amber-500/30 flex flex-col items-center group/pts hover:bg-amber-500/25 transition-premium cursor-default shadow-sm text-amber-600">
                                <p className="text-[9px] font-black uppercase tracking-widest mb-1 group-hover:scale-95 transition-transform">
                                  REWARD PTS
                                </p>
                                <div className="flex items-center gap-1.5 group-hover:scale-110 transition-transform">
                                  <Star className="w-4 h-4 fill-current animate-pulse" />
                                  <span className="font-black text-2xl tracking-tight">{points.toLocaleString()}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-10 pt-8 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary/5 group-hover:bg-primary/10 transition-premium">
                              <IdCard className="w-5 h-5 text-primary opacity-60" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">
                                วันที่เริ่มเป็นสมาชิก
                              </p>
                              <p className="text-xs font-black uppercase tracking-tight text-primary/80">
                                {format(new Date(user.created_at), "dd MMMM yyyy", { locale: th })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {onlineUsers.has(user.id) ? (
                              <div className="flex items-center gap-2.5 px-6 h-12 rounded-2xl bg-emerald-500/5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 border border-emerald-500/10">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                สถานะ: <span className="text-foreground">ออนไลน์</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2.5 px-6 h-12 rounded-2xl bg-muted/30 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border border-transparent">
                                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                                สถานะ: <span className="opacity-60">ออฟไลน์</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Point Adjustment Dialog */}
      <Dialog open={!!pointsDialog} onOpenChange={(open) => !open && setPointsDialog(null)}>
        <DialogContent className="sm:max-w-md rounded-4xl border-none shadow-premium p-12 bg-card">
          <DialogHeader className="space-y-8">
            <div className="w-24 h-24 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto ring-8 ring-amber-500/5">
              <Star className="w-10 h-10 fill-amber-500" />
            </div>
            <div className="space-y-4 text-center">
              <DialogTitle className="text-3xl font-black uppercase tracking-tight">ปรับปรุงแต้มสะสม</DialogTitle>
              <DialogDescription className="text-sm font-bold opacity-60 px-4 leading-relaxed">
                แก้ไขคะแนนสำหรับคุณ {pointsDialog?.userName}
                <br />
                ปัจจุบันมี <span className="text-amber-600 font-black">{pointsDialog?.currentPoints.toLocaleString()} แต้ม</span>
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-8 py-6">
            <div className="grid grid-cols-3 gap-3">
              {(["earn", "redeem", "adjust"] as const).map((t) => (
                <Button
                  key={t}
                  variant="outline"
                  className={cn(
                    "h-20 rounded-2xl border-none flex flex-col gap-2 transition-all p-0",
                    pointAdjust.type === t ? "bg-primary text-white shadow-lg" : "bg-muted/30 hover:bg-muted/50",
                  )}
                  onClick={() => setPointAdjust({ ...pointAdjust, type: t })}
                >
                  {t === "earn" ? (
                    <Plus className="w-5 h-5" />
                  ) : t === "redeem" ? (
                    <Minus className="w-5 h-5" />
                  ) : (
                    <History className="w-5 h-5" />
                  )}
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {t === "earn" ? "เพิ่มแต้ม" : t === "redeem" ? "แลกใช้" : "ปรับยอด"}
                  </span>
                </Button>
              ))}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2 leading-none">
                จำนวนแต้มที่ต้องการ {pointAdjust.type === "earn" ? "เพิ่ม" : pointAdjust.type === "redeem" ? "หักออก" : "ปรับปรุง"}
              </label>
              <Input
                type="number"
                placeholder="ระบุจำนวนแต้ม..."
                className="h-16 rounded-2xl bg-muted/20 border-none px-8 font-black text-2xl text-center focus-visible:ring-primary/20 shadow-inner"
                value={pointAdjust.amount}
                onChange={(e) => setPointAdjust({ ...pointAdjust, amount: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button
              variant="ghost"
              className="h-14 flex-1 rounded-2xl font-black uppercase text-[11px] tracking-widest"
              onClick={() => setPointsDialog(null)}
            >
              ยกเลิก
            </Button>
            <Button
              className="h-14 flex-1 rounded-2xl font-black uppercase text-[11px] tracking-widest bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20"
              onClick={handleAdjustSubmit}
              disabled={adjustPoints.isPending || !pointAdjust.amount}
            >
              {adjustPoints.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "บันทึกการปรับปรุง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-md rounded-4xl border-none shadow-premium p-12 bg-card">
          <div className="w-24 h-24 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-10 ring-8 ring-amber-500/5">
            <AlertTriangle className="w-12 h-12" />
          </div>

          <DialogHeader className="space-y-4">
            <DialogTitle className="text-3xl font-black uppercase tracking-tight text-center">ยืนยันการเปลี่ยนสิทธิ์?</DialogTitle>
            <DialogDescription className="text-center font-bold text-sm opacity-60 leading-relaxed px-6">
              คุณกำลังจะยกระดับ/เปลี่ยนบทบาทบัญชีนี้เป็น{" "}
              <span className="text-amber-600 font-black underline underline-offset-8 decoration-2">{confirmDialog?.label}</span>{" "}
              จะมีผลต่อการเข้าถึงข้อมูลระบบในทันที
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="grid grid-cols-2 gap-4 mt-12">
            <Button
              variant="ghost"
              className="h-16 rounded-3xl font-black uppercase text-[11px] tracking-widest"
              onClick={() => setConfirmDialog(null)}
            >
              ยกเลิก
            </Button>
            <Button
              className="h-16 rounded-3xl font-black uppercase text-[11px] tracking-widest bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20"
              onClick={confirmRoleUpdate}
            >
              ยืนยันเปลี่ยนสิทธิ์
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

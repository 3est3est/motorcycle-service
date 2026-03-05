"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import {
  Star,
  History as HistoryIcon,
  TrendingUp,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  Trophy,
  CheckCircle2,
  QrCode,
  Calendar,
  Sparkles,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface PointTransaction {
  id: string;
  event_type: "earn" | "redeem" | "adjust";
  points: number;
  created_at: string;
}

interface PointsData {
  total_points: number;
  transactions: PointTransaction[];
}

export default function PointsPage() {
  const queryClient = useQueryClient();
  const [redeemDialog, setRedeemDialog] = useState<{
    points: number;
    title: string;
  } | null>(null);

  const [successVoucher, setSuccessVoucher] = useState<{
    points: number;
    title: string;
    code: string;
  } | null>(null);

  const { data = { total_points: 0, transactions: [] }, isLoading } = useQuery<PointsData>({
    queryKey: ["points"],
    queryFn: async () => {
      const res = await fetch("/api/points");
      if (!res.ok) throw new Error("Could not fetch points");
      return res.json();
    },
  });

  const redeemPoints = useMutation({
    mutationFn: async ({ points, title }: { points: number; title: string }) => {
      const res = await fetch("/api/points/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points_to_redeem: points, description: title }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to redeem points");
      }
      return res.json();
    },
    onSuccess: (dataRes, variables) => {
      queryClient.invalidateQueries({ queryKey: ["points"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      // Generate a mock code for the voucher
      const mockCode = `MTD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setSuccessVoucher({
        points: variables.points,
        title: variables.title,
        code: mockCode,
      });

      setRedeemDialog(null);
    },
    onError: (err: any) => {
      toast.error(err.message);
      setRedeemDialog(null);
    },
  });

  const lifetimePoints = data.transactions
    .filter((tx) => tx.event_type === "earn" || (tx.event_type === "adjust" && tx.points > 0))
    .reduce((sum, tx) => sum + tx.points, 0);

  const eventLabel = {
    earn: {
      label: "ได้รับ",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      icon: ArrowUpRight,
    },
    redeem: {
      label: "แลกใช้",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      icon: ArrowDownRight,
    },
    adjust: {
      label: "ปรับปรุง",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      icon: HistoryIcon,
    },
  };

  const handleRedeem = (points: number, title: string) => {
    if (data.total_points < points) {
      toast.error("คะแนนของคุณไม่เพียงพอสำหรับการแลกนี้");
      return;
    }
    setRedeemDialog({ points, title });
  };

  const confirmRedeem = () => {
    if (!redeemDialog) return;
    redeemPoints.mutate({
      points: redeemDialog.points,
      title: redeemDialog.title,
    });
  };

  if (isLoading) {
    return (
      <div className="animate-fluid pb-10 max-w-7xl mx-auto">
        <TopBar title="คะแนนสะสม" subtitle="ตรวจสอบแต้มสะสมและสิทธิพิเศษสำหรับคุณ" />
        <div className="px-6 space-y-10 mt-8">
          <Skeleton className="h-80 w-full rounded-4xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-[600px] lg:col-span-2 rounded-4xl" />
            <Skeleton className="h-[600px] rounded-4xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fluid pb-10 max-w-7xl mx-auto">
      <TopBar title="คะแนนสะสม" subtitle="ตรวจสอบแต้มสะสมและสิทธิพิเศษสำหรับคุณ" />

      <div className="px-6 space-y-10 mt-8">
        {/* Main Points Card */}
        <div className="relative overflow-hidden bg-primary p-12 rounded-4xl text-white group shadow-premium hover:shadow-2xl transition-all duration-700 h-80 flex flex-col justify-center border-none">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-amber-300 animate-pulse" />
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.4em]">MTD ELITE LOYALTY</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-9xl font-black tracking-tighter group-hover:scale-105 transition-all duration-700 origin-left inline-block">
                  {data.total_points.toLocaleString("th-TH")}
                </span>
                <span className="text-2xl font-black opacity-40 uppercase tracking-widest">แต้มปัจจุบัน</span>
              </div>
              <div className="flex items-center gap-6 mt-6">
                <div className="h-2 flex-1 max-w-sm bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/40 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((data.total_points / 2000) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">LIFETIME: {lifetimePoints.toLocaleString()} PTS</span>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center px-8 py-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/15 transition-all">
                <TrendingUp className="w-6 h-6 mb-3 opacity-80" />
                <span className="text-[9px] opacity-40 uppercase font-black tracking-widest mb-1 text-center">Membership</span>
                <span className="font-black text-lg uppercase tracking-tight">{lifetimePoints > 5000 ? "Gold" : "Silver"}</span>
              </div>
              <div className="flex flex-col items-center px-8 py-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/15 transition-all">
                <Sparkles className="w-6 h-6 mb-3 opacity-80 text-amber-300" />
                <span className="text-[9px] opacity-40 uppercase font-black tracking-widest mb-1 text-center">Rewards</span>
                <span className="font-black text-lg uppercase tracking-tight">{data.total_points >= 500 ? "Active" : "Locked"}</span>
              </div>
            </div>
          </div>

          <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-[100px] group-hover:bg-white/10 transition-all duration-1000" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Points History */}
          <Card className="lg:col-span-2 border-none shadow-premium rounded-4xl overflow-hidden bg-card/50">
            <CardHeader className="p-10 pb-6 border-b border-muted-foreground/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <HistoryIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight">ประวัติคะแนน</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">
                      รายการย้อนหลังทั้งหมดของคุณ
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 rounded-xl">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Active System</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {data.transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-32 opacity-20">
                    <Star className="w-24 h-24 mb-6 stroke-1" />
                    <p className="font-black uppercase tracking-[0.3em] text-[10px]">ยังไม่มีรายการแต้มสะสม</p>
                  </div>
                ) : (
                  <div className="divide-y divide-muted-foreground/5">
                    {data.transactions.map((tx) => {
                      const cfg = eventLabel[tx.event_type] || eventLabel.adjust;
                      const Icon = cfg.icon;
                      return (
                        <div key={tx.id} className="flex items-center justify-between p-10 hover:bg-primary/5 transition-all group">
                          <div className="flex items-center gap-8">
                            <div
                              className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-110",
                                cfg.bg,
                                cfg.color,
                                "group-hover:border-current",
                              )}
                            >
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="space-y-2">
                              <p className="font-black text-lg uppercase tracking-tight">{cfg.label}คะแนน</p>
                              <div className="flex items-center gap-3">
                                <Badge
                                  variant="outline"
                                  className="text-[8px] font-black uppercase tracking-widest px-2 py-0 border-muted-foreground/20"
                                >
                                  {tx.event_type}
                                </Badge>
                                <p className="text-[10px] font-medium opacity-40">
                                  {format(new Date(tx.created_at), "d MMM yyyy, HH:mm", { locale: th })}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div
                            className={cn(
                              "text-right font-black text-3xl tracking-tighter",
                              tx.event_type === "earn" ? "text-emerald-500" : "text-rose-500",
                            )}
                          >
                            {tx.event_type === "earn" ? "+" : "-"}
                            {tx.points.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Rewards Section */}
          <div className="space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary px-2 flex items-center gap-2">
              <Gift className="w-4 h-4" /> AVAILABLE REWARDS
            </h3>

            <div className="grid gap-6">
              {[
                {
                  title: "ฟรีเปลี่ยนถ่ายน้ำมันเครื่อง",
                  cost: 500,
                  detail: "สำหรับรถขนาดไม่เกิน 300cc",
                  color: "bg-amber-500",
                },
                {
                  title: "ส่วนลดอะไหล่ 10%",
                  cost: 1200,
                  detail: "ใช้ได้กับอะไหล่แท้ทุกชิ้น",
                  color: "bg-indigo-500",
                },
                {
                  title: "พรีเมียมเคลือบแก้ว",
                  cost: 2500,
                  detail: "ปกป้องสีรถให้เงางามเสมอ",
                  color: "bg-emerald-500",
                },
              ].map((reward) => {
                const canRedeem = data.total_points >= reward.cost;
                return (
                  <div
                    key={reward.title}
                    className={cn(
                      "relative p-8 rounded-4xl border overflow-hidden transition-all duration-300 group/item active-prime shadow-sm",
                      canRedeem ? "border-primary/10 bg-card hover:shadow-xl hover:-translate-y-1" : "bg-muted/30 opacity-60 grayscale",
                    )}
                  >
                    <div className="relative z-10 space-y-6">
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-lg uppercase tracking-tight max-w-[150px] leading-tight">{reward.title}</h4>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg", reward.color)}>
                          <Gift className="w-5 h-5" />
                        </div>
                      </div>

                      <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest leading-relaxed">{reward.detail}</p>

                      <div className="flex items-center justify-between pt-4 border-t border-muted">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="font-black text-xl tracking-tighter text-primary">{reward.cost}</span>
                        </div>
                        <Button
                          disabled={!canRedeem || redeemPoints.isPending}
                          size="sm"
                          className={cn(
                            "rounded-full font-black uppercase text-[9px] tracking-[0.2em] h-10 px-6",
                            canRedeem ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground",
                          )}
                          onClick={() => handleRedeem(reward.cost, reward.title)}
                        >
                          {canRedeem ? "Redeem Now" : "Earn More"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!redeemDialog} onOpenChange={(open) => !open && setRedeemDialog(null)}>
        <DialogContent className="sm:max-w-md rounded-4xl border-none shadow-2xl p-0 overflow-hidden bg-card">
          <div className="p-12 space-y-8">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto animate-in zoom-in duration-500">
              <Gift className="w-12 h-12" />
            </div>
            <div className="space-y-4 text-center">
              <DialogTitle className="text-3xl font-black uppercase tracking-tight">ยืนยันการแลกแต้ม?</DialogTitle>
              <DialogDescription className="text-sm font-bold opacity-60 px-4">
                คุณกำลังจะใช้ <span className="text-primary font-black underline underline-offset-8 decoration-2">{redeemDialog?.points} แต้ม</span>
                <br />
                เพื่อรับ <span className="text-foreground font-black italic">"{redeemDialog?.title}"</span>
              </DialogDescription>
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <Button
                className="h-16 rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] shadow-xl shadow-primary/20 w-full"
                onClick={confirmRedeem}
                disabled={redeemPoints.isPending}
              >
                {redeemPoints.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "ยืนยันการแลกรางวัล"}
              </Button>
              <Button
                variant="ghost"
                className="h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest text-muted-foreground"
                onClick={() => setRedeemDialog(null)}
              >
                ไว้ทีหลัง
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Voucher Dialog */}
      <Dialog open={!!successVoucher} onOpenChange={(open) => !open && setSuccessVoucher(null)}>
        <DialogContent className="sm:max-w-lg rounded-4xl border-none shadow-3xl p-0 overflow-hidden bg-slate-950 text-white">
          <div className="relative p-12 text-center overflow-hidden">
            {/* Animated sparkles */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <Sparkles
                  key={i}
                  className={cn(
                    "absolute w-6 h-6 text-amber-500 animate-pulse",
                    i === 0 && "top-10 left-10",
                    i === 1 && "top-20 right-20",
                    i === 2 && "bottom-20 left-40",
                    i === 3 && "top-1/2 right-10",
                    i === 4 && "bottom-10 right-40",
                    i === 5 && "top-40 left-1/2",
                  )}
                />
              ))}
            </div>

            <div className="relative z-10 space-y-8 py-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500">Redemption Successful</p>
                <h2 className="text-4xl font-black tracking-tight uppercase leading-tight">{successVoucher?.title}</h2>
              </div>

              <Separator className="bg-white/10" />

              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Verification Code</p>
                  <div className="flex items-center justify-center gap-4 bg-slate-900 p-4 rounded-2xl border border-white/5 border-dashed">
                    <span className="text-3xl font-black tracking-[0.3em] font-mono text-primary">{successVoucher?.code}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 pt-2">
                  <QrCode className="w-32 h-32 opacity-80" />
                  <div className="flex items-center gap-2 text-[10px] font-bold opacity-40 uppercase tracking-widest">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Expires in 30 days</span>
                  </div>
                </div>
              </div>

              <p className="text-xs font-medium text-white/40 leading-relaxed max-w-xs mx-auto italic">
                กรุณาแสดงหน้าจอ Voucher นี้ให้เจ้าหน้าที่ที่เคาน์เตอร์ <br /> หรือจับภาพหน้าจอเก็บไว้เพื่อรับบริการ
              </p>

              <Button
                className="w-full h-16 rounded-3xl bg-white text-slate-950 hover:bg-white/90 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-white/5 mt-4"
                onClick={() => setSuccessVoucher(null)}
              >
                เสร็จสิ้น
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

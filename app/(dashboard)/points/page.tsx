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
import { Badge } from "@/components/ui/badge";
import {
  Star,
  History,
  TrendingUp,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PointsData>({
    total_points: 0,
    transactions: [],
  });

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await fetch("/api/points");
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Failed to fetch points", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, []);

  const eventLabel = {
    earn: {
      label: "ได้รับ",
      color: "text-success",
      bg: "bg-success/10",
      icon: ArrowUpRight,
    },
    redeem: {
      label: "แลกใช้",
      color: "text-destructive",
      bg: "bg-destructive/10",
      icon: ArrowDownRight,
    },
    adjust: {
      label: "ปรับปรุง",
      color: "text-primary",
      bg: "bg-primary/10",
      icon: History,
    },
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-muted-foreground">กำลังโหลดข้อมูลคะแนนสะสม...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      <TopBar
        title="คะแนนสะสม"
        subtitle="ตรวจสอบแต้มสะสมและสิทธิพิเศษสำหรับคุณ"
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Main Points Card */}
        <div className="relative overflow-hidden bg-linear-to-br from-primary to-primary-foreground p-8 rounded-3xl text-white shadow-lg shadow-primary/20">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-white/80 text-sm font-medium">
                คะแนนปัจจุบันของคุณ
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tight">
                  {data.total_points.toLocaleString("th-TH")}
                </span>
                <span className="text-xl font-medium opacity-80">แต้ม</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <TrendingUp className="w-5 h-5 mb-1" />
                <span className="text-xs opacity-80 uppercase tracking-wider">
                  Level
                </span>
                <span className="font-bold">Member</span>
              </div>
              <div className="flex flex-col items-center px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <Gift className="w-5 h-5 mb-1" />
                <span className="text-xs opacity-80 uppercase tracking-wider">
                  Rewards
                </span>
                <span className="font-bold">4 Available</span>
              </div>
            </div>
          </div>
          {/* Abstract BG Decorations */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-5%] w-48 h-48 bg-primary-foreground/20 rounded-full blur-2xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Points History */}
          <Card className="lg:col-span-2 border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">ประวัติคะแนน</CardTitle>
                  <CardDescription>
                    รายการรับและแลกคะแนนสะสมย้อนหลัง
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/10">
                  <Star className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">ยังไม่มีรายการแต้มสะสม</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {data.transactions.map((tx) => {
                    const cfg = eventLabel[tx.event_type] || eventLabel.adjust;
                    const TxIcon = cfg.icon;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0`}
                          >
                            <TxIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">
                              {cfg.label}คะแนน
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(tx.created_at),
                                "d MMMM yyyy, HH:mm น.",
                                { locale: th },
                              )}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`text-right ${tx.event_type === "earn" ? "text-success" : "text-destructive"} font-bold text-lg`}
                        >
                          {tx.event_type === "earn" ? "+" : "-"}
                          {tx.points.toLocaleString("th-TH")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Special Rewards (Mockup) */}
          <Card className="border-border/50 shadow-sm overflow-hidden h-fit">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10 text-warning">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">สิทธิพิเศษ</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[
                { title: "ฟรีค่าแรงเปลี่ยนถ่ายน้ำมันเครื่อง", cost: 500 },
                { title: "ส่วนลดอะไหล่ 10%", cost: 1200 },
              ].map((reward) => (
                <div
                  key={reward.title}
                  className="p-4 rounded-2xl border border-border/50 bg-muted/20 opacity-80 cursor-not-allowed group"
                >
                  <p className="text-sm font-bold text-foreground mb-2">
                    {reward.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 text-warning fill-warning" />
                      {reward.cost} แต้ม
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold tracking-wider"
                    >
                      🔒 Locked
                    </Badge>
                  </div>
                </div>
              ))}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <AlertCircle className="w-4 h-4 text-primary" />
                </div>
                <p className="text-[10px] text-primary/80 leading-relaxed font-medium">
                  สะสมแต้มจากการชำระค่าบริการ ทุกๆ 100 บาท รับ 10 แต้ม
                  เพื่อแลกรับสิทธิพิเศษมากมาย
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

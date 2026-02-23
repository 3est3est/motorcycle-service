import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Star, TrendingUp, Gift, ArrowUp, ArrowDown } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "คะแนนสะสม",
};

const totalPoints = 1250;

const transactions = [
  {
    id: "PT-001",
    type: "earn" as const,
    points: 700,
    description: "ชำระเงินงานซ่อม RJ-0038",
    date: "12 ม.ค. 2569",
  },
  {
    id: "PT-002",
    type: "earn" as const,
    points: 550,
    description: "ชำระเงินงานซ่อม RJ-0035",
    date: "5 ธ.ค. 2568",
  },
];

export default function PointsPage() {
  return (
    <div className="animate-fade-in">
      <TopBar title="คะแนนสะสม" subtitle="ดูและติดตามแต้มสะสมของคุณ" />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Points card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/5 rounded-full translate-y-1/3" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              <span className="text-primary-foreground/80 text-sm font-medium">
                คะแนนสะสมของคุณ
              </span>
            </div>
            <p className="text-5xl sm:text-6xl font-bold mb-1">
              {totalPoints.toLocaleString("th-TH")}
            </p>
            <p className="text-primary-foreground/70 text-sm">แต้ม</p>

            <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-white/20">
              <div>
                <p className="text-xs text-primary-foreground/60 mb-0.5">
                  แต้มที่ได้รับ
                </p>
                <p className="font-bold">+1,250 แต้ม</p>
              </div>
              <div>
                <p className="text-xs text-primary-foreground/60 mb-0.5">
                  ใช้ไปแล้ว
                </p>
                <p className="font-bold">0 แต้ม</p>
              </div>
              <div>
                <p className="text-xs text-primary-foreground/60 mb-0.5">
                  อัตราสะสม
                </p>
                <p className="font-bold">1 แต้ม / ฿1</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  แต้มรอบนี้
                </p>
                <p className="font-bold text-foreground text-lg">+700 แต้ม</p>
                <p className="text-xs text-muted-foreground">
                  จากการชำระเงินล่าสุด
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  แลกรับได้
                </p>
                <p className="font-bold text-foreground text-lg">12 รายการ</p>
                <p className="text-xs text-muted-foreground">
                  สิทธิประโยชน์ที่พร้อมแลก
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction history */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            ประวัติคะแนน
          </h2>
          <Card>
            {transactions.map((tx, idx) => (
              <CardContent
                key={tx.id}
                className={`p-4 flex items-center justify-between ${
                  idx < transactions.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      tx.type === "earn" ? "bg-success/10" : "bg-destructive/10"
                    }`}
                  >
                    {tx.type === "earn" ? (
                      <ArrowUp className="w-4 h-4 text-success" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {tx.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <p
                  className={`font-bold ${tx.type === "earn" ? "text-success" : "text-destructive"}`}
                >
                  {tx.type === "earn" ? "+" : "-"}
                  {tx.points} แต้ม
                </p>
              </CardContent>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

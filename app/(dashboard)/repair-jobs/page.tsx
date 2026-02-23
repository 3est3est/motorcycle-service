import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ติดตามงานซ่อม",
};

const mockRepairJobs = [
  {
    id: "RJ-0042",
    bookingId: "BK-0001",
    created: "23 ก.พ. 2569",
    motorcycle: "ฮอนด้า PCX 150 · ทต 4521 กทม",
    status: "in_progress" as const,
    laborCost: 500,
    partsUsed: ["ผ้าเบรกหน้า", "น้ำมันเครื่อง"],
    estimatedTotal: 2800,
  },
  {
    id: "RJ-0038",
    bookingId: "BK-0002",
    created: "10 ม.ค. 2569",
    motorcycle: "ยามาฮ่า NMAX · กก 5555 กทม",
    status: "delivered" as const,
    laborCost: 200,
    partsUsed: ["น้ำมันเครื่อง"],
    estimatedTotal: 700,
  },
];

const statusConfig = {
  created: { label: "สร้างแล้ว", variant: "secondary" as const },
  in_progress: { label: "กำลังซ่อม", variant: "warning" as const },
  completed: { label: "ซ่อมเสร็จ", variant: "confirmed" as const },
  delivered: { label: "ส่งมอบแล้ว", variant: "completed" as const },
};

const progressMap = {
  created: 10,
  in_progress: 50,
  completed: 80,
  delivered: 100,
};

export default function RepairJobsPage() {
  return (
    <div className="animate-fade-in">
      <TopBar title="ติดตามงานซ่อม" subtitle="สถานะงานซ่อมของคุณ" />
      <div className="p-4 sm:p-6 space-y-4">
        {mockRepairJobs.map((job) => {
          const cfg = statusConfig[job.status];
          const progress = progressMap[job.status];
          return (
            <Card
              key={job.id}
              className="hover:shadow-md transition-all hover:border-primary/20"
            >
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{job.id}</p>
                      <p className="text-xs text-muted-foreground">
                        สร้างเมื่อ {job.created}
                      </p>
                    </div>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {job.motorcycle}
                </p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">ความคืบหน้า</span>
                    <span className="font-medium text-foreground">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {["รับรถ", "ตรวจ", "ซ่อม", "เสร็จ"].map((step, i) => (
                      <span
                        key={step}
                        className={`text-[10px] ${(progress / 100) * 4 > i ? "text-primary font-medium" : "text-muted-foreground"}`}
                      >
                        {step}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Parts & Cost */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      อะไหล่ที่ใช้
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {job.partsUsed.join(", ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      ค่าใช้จ่ายรวม
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      ฿{job.estimatedTotal.toLocaleString("th-TH")}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  id={`view-job-${job.id}`}
                >
                  ดูรายละเอียดงานซ่อม
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

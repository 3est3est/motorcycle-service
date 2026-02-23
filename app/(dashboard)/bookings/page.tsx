import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "การจองคิวซ่อม",
};

type BookingS = "pending" | "confirmed" | "cancelled" | "completed";

const mockBookings: {
  id: string;
  date: string;
  time: string;
  motorcycle: string;
  licensePlate: string;
  symptom: string;
  status: BookingS;
}[] = [
  {
    id: "BK-0001",
    date: "25 ก.พ. 2569",
    time: "10:00 น.",
    motorcycle: "ฮอนด้า PCX 150",
    licensePlate: "ทต 4521 กทม",
    symptom: "สตาร์ทยาก เครื่องดับ",
    status: "confirmed",
  },
  {
    id: "BK-0002",
    date: "10 ม.ค. 2569",
    time: "14:00 น.",
    motorcycle: "ยามาฮ่า NMAX",
    licensePlate: "กก 5555 กทม",
    symptom: "เปลี่ยนน้ำมันเครื่อง เช็คระยะ",
    status: "completed",
  },
  {
    id: "BK-0003",
    date: "5 ธ.ค. 2568",
    time: "09:00 น.",
    motorcycle: "ฮอนด้า PCX 150",
    licensePlate: "ทต 4521 กทม",
    symptom: "เบรกหน้าไม่ค่อยกัด",
    status: "cancelled",
  },
];

const statusConfig = {
  pending: {
    label: "รอยืนยัน",
    variant: "pending" as const,
    icon: Clock,
  },
  confirmed: {
    label: "ยืนยันแล้ว",
    variant: "confirmed" as const,
    icon: CheckCircle2,
  },
  cancelled: {
    label: "ยกเลิก",
    variant: "cancelled" as const,
    icon: XCircle,
  },
  completed: {
    label: "เสร็จสิ้น",
    variant: "completed" as const,
    icon: CheckCircle2,
  },
};

export default function BookingsPage() {
  return (
    <div className="animate-fade-in">
      <TopBar title="การจองคิวซ่อม" subtitle="จัดการการนัดหมายและคิวซ่อม" />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              พบ <strong>{mockBookings.length}</strong> รายการ
            </p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" id="create-booking-btn">
            <Plus className="w-4 h-4" />
            จองคิวซ่อมใหม่
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["ทั้งหมด", "รอยืนยัน", "ยืนยันแล้ว", "เสร็จสิ้น", "ยกเลิก"].map(
            (tab, idx) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors min-h-[36px] ${
                  idx === 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tab}
              </button>
            ),
          )}
        </div>

        {/* Booking list */}
        <div className="space-y-4">
          {mockBookings.map((booking) => {
            const cfg = statusConfig[booking.status];
            const StatusIcon = cfg.icon;
            return (
              <Card
                key={booking.id}
                className="hover:shadow-md transition-all duration-200 hover:border-primary/20 group"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-foreground">
                            {booking.id}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.date} เวลา {booking.time}
                          </p>
                        </div>
                        <Badge variant={cfg.variant}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {cfg.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5" />
                          {booking.motorcycle}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                            {booking.licensePlate}
                          </span>
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-muted/50 text-sm text-foreground/80">
                        <span className="text-xs font-medium text-muted-foreground block mb-0.5">
                          อาการเสีย
                        </span>
                        {booking.symptom}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        id={`view-booking-${booking.id}`}
                      >
                        รายละเอียด
                      </Button>
                      {booking.status === "pending" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          id={`cancel-booking-${booking.id}`}
                        >
                          ยกเลิก
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {mockBookings.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1">ยังไม่มีการจอง</p>
            <p className="text-sm mb-6">
              กดปุ่มด้านล่างเพื่อจองคิวซ่อมครั้งแรก
            </p>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              จองคิวซ่อมตอนนี้
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

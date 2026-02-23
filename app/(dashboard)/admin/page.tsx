"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Bike,
  User,
  Check,
  X,
  Loader2,
  CalendarCheck,
  TrendingUp,
  Wrench,
  CircleDollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

export default function AdminPage() {
  const [data, setData] = useState<{
    bookings: any[];
    stats: {
      pendingBookings: number;
      activeRepairs: number;
      totalPendingAmount: number;
    };
  }>({
    bookings: [],
    stats: {
      pendingBookings: 0,
      activeRepairs: 0,
      totalPendingAmount: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      // ดึงทั้งข้อมูลจองและข้อมูลงานสรุป
      const [bookingsRes, repairsRes, paymentsRes] = await Promise.all([
        fetch("/api/staff/bookings"),
        fetch("/api/staff/repairs"),
        fetch("/api/payments"), // ในอนาคตควรมี API สรุปยอดเงินรายเดือนแยกต่างหาก
      ]);

      if (bookingsRes.ok && repairsRes.ok) {
        const bookings = await bookingsRes.json();
        const repairs = await repairsRes.json();

        setData({
          bookings,
          stats: {
            pendingBookings: bookings.filter((b: any) => b.status === "pending")
              .length,
            activeRepairs: repairs.filter(
              (r: any) => r.status === "in_progress",
            ).length,
            totalPendingAmount: 0, // Placeholder
          },
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAction = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/staff/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      alert("ดำเนินการไม่สำเร็จ");
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          กำลังโหลดระบบจัดการหลังบ้าน...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      <TopBar
        title="จัดการระบบหลังบ้าน"
        subtitle="ภาพรวมการทำงานและรายการร้องขอจากลูกค้าวันนี้"
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Admin Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  จองคิวใหม่
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">
                    {data.stats.pendingBookings}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    คิวที่รอยืนยัน
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-warning text-white flex items-center justify-center shadow-lg shadow-warning/20">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  ซ่อมอยู่ขณะนี้
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">
                    {data.stats.activeRepairs}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    คันที่กำลังทำงาน
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-success text-white flex items-center justify-center shadow-lg shadow-success/20">
                <CircleDollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  สถานะร้านค้า
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">
                    Active
                  </span>
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List: Incoming Bookings */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-foreground">
              คำขอจองคิวใหม่
            </h3>
            {data.bookings.filter((b) => b.status === "pending").length ===
            0 ? (
              <div className="py-20 text-center bg-muted/20 border-2 border-dashed rounded-3xl">
                <Check className="w-12 h-12 mx-auto mb-3 opacity-10 text-success" />
                <p className="text-muted-foreground">
                  ยืนยันการจองครบถ้วนแล้ว ไม่มีงานค้าง
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.bookings
                  .filter((b) => b.status === "pending")
                  .map((b) => (
                    <Card
                      key={b.id}
                      className="group hover:border-primary/50 transition-all shadow-xs overflow-hidden"
                    >
                      <CardContent className="p-0">
                        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center shrink-0">
                              <Calendar className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-black text-foreground text-lg uppercase">
                                {format(
                                  new Date(b.booking_time),
                                  "MMM d, HH:mm น.",
                                  { locale: th },
                                )}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5 font-bold text-foreground/80">
                                  <Bike className="w-3.5 h-3.5" />
                                  {b.motorcycle.brand} {b.motorcycle.model} (
                                  {b.motorcycle.license_plate})
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5" />
                                  {b.customer.full_name}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end sm:justify-start">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive h-10 px-4 hover:bg-destructive/10"
                              onClick={() => handleAction(b.id, "cancelled")}
                            >
                              <X className="w-4 h-4 mr-2" /> ปฏิเสธ
                            </Button>
                            <Button
                              size="sm"
                              className="h-10 px-6 shadow-md shadow-primary/20"
                              onClick={() => handleAction(b.id, "confirmed")}
                            >
                              <Check className="w-4 h-4 mr-2" /> ยืนยันการจอง
                            </Button>
                          </div>
                        </div>
                        {b.symptom_note && (
                          <div className="px-5 py-3 bg-muted/30 border-t border-border/50">
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                              &ldquo; {b.symptom_note} &rdquo;
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>

          {/* Side List: Recent History */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">
              ดำเนินการล่าสุด
            </h3>
            <Card>
              <CardContent className="p-0 divide-y">
                {data.bookings
                  .filter((b) => b.status !== "pending")
                  .slice(0, 8)
                  .map((b) => (
                    <div
                      key={b.id}
                      className="p-4 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {b.customer.full_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {b.motorcycle.license_plate}
                        </p>
                      </div>
                      <Badge
                        variant={
                          b.status === "confirmed" ? "confirmed" : "cancelled"
                        }
                        className="text-[10px] h-5 px-1.5 font-bold uppercase"
                      >
                        {b.status === "confirmed" ? "Confirmed" : "Rejected"}
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
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

import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch Bookings with TanStack Query
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: async () => {
      const res = await fetch("/api/staff/bookings");
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
    refetchInterval: 5000, // Real-time polling every 5 seconds
  });

  // Fetch Repairs with TanStack Query
  const { data: repairs = [], isLoading: isLoadingRepairs } = useQuery({
    queryKey: ["admin", "repairs"],
    queryFn: async () => {
      const res = await fetch("/api/staff/repairs");
      if (!res.ok) throw new Error("Failed to fetch repairs");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const stats = {
    pendingBookings: bookings.filter((b: any) => b.status === "pending").length,
    activeRepairs: repairs.filter((r: any) => r.status === "in_progress")
      .length,
    totalPendingAmount: 0,
  };

  const handleAction = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/staff/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        // Refresh immediately after action
        queryClient.invalidateQueries({ queryKey: ["admin"] });
      } else {
        const error = await res.json();
        alert(error.message || "ดำเนินการไม่สำเร็จ");
      }
    } catch (err) {
      alert("เชื่อมต่อเซิร์ฟเวอร์ผิดพลาด");
    } finally {
      setUpdatingId(null);
    }
  };

  const loading = isLoadingBookings || isLoadingRepairs;

  if (loading && bookings.length === 0) {
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
                    {stats.pendingBookings}
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
                    {stats.activeRepairs}
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
            {bookings.filter((b: any) => b.status === "pending").length ===
            0 ? (
              <div className="py-20 text-center bg-muted/20 border-2 border-dashed rounded-3xl">
                <Check className="w-12 h-12 mx-auto mb-3 opacity-10 text-success" />
                <p className="text-muted-foreground">
                  ยืนยันการจองครบถ้วนแล้ว ไม่มีงานค้าง
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings
                  .filter((b: any) => b.status === "pending")
                  .map((b: any) => (
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
                              disabled={updatingId === b.id}
                              loading={updatingId === b.id}
                            >
                              {!updatingId || updatingId !== b.id ? (
                                <>
                                  <X className="w-4 h-4 mr-2" /> ปฏิเสธ
                                </>
                              ) : null}
                            </Button>
                            <Button
                              size="sm"
                              variant="success"
                              className="h-10 px-6 shadow-lg shadow-success/20 font-bold"
                              onClick={() => handleAction(b.id, "confirmed")}
                              disabled={updatingId === b.id}
                              loading={updatingId === b.id}
                            >
                              {!updatingId || updatingId !== b.id ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />{" "}
                                  ยืนยันการจอง
                                </>
                              ) : null}
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
                {bookings
                  .filter((b: any) => b.status !== "pending")
                  .slice(0, 8)
                  .map((b: any) => (
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

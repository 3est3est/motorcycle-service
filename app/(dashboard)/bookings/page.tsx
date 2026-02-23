"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Plus,
  Clock,
  Bike,
  MapPin,
  AlertCircle,
  Loader2,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { bookingSchema, type BookingInput } from "@/lib/validations";
import Link from "next/link";

interface Motorcycle {
  id: string;
  brand: string;
  model: string;
  license_plate: string;
}

interface Booking {
  id: string;
  booking_time: string;
  symptom_note: string | null;
  status: string;
  motorcycle: Motorcycle;
}

const statusConfig: Record<string, { label: string; variant: any }> = {
  pending: { label: "รอยืนยัน", variant: "pending" },
  confirmed: { label: "ยืนยันแล้ว", variant: "confirmed" },
  cancelled: { label: "ยกเลิก", variant: "cancelled" },
  completed: { label: "เสร็จสิ้น", variant: "completed" },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [form, setForm] = useState<BookingInput>({
    motorcycle_id: "",
    booking_time: "",
    symptom_note: "",
  });
  const [errors, setErrors] = useState<Partial<BookingInput>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const fetchData = async () => {
    try {
      const [bookingsRes, mcRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/motorcycles"),
      ]);

      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (mcRes.ok) setMotorcycles(await mcRes.json());
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const parsed = bookingSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: any = {};
      parsed.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (res.ok) {
        setShowAddForm(false);
        setForm({ motorcycle_id: "", booking_time: "", symptom_note: "" });
        setErrors({});
        fetchData();
      } else {
        const data = await res.json();
        setServerError(data.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      setServerError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <TopBar
        title="การจองคิวซ่อม"
        subtitle="จองวันและเวลา หรือติดตามสถานะการซ่อม"
      />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-4 border-primary text-primary bg-primary/5"
            >
              ทั้งหมด
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full px-4">
              ที่ยังไม่เสร็จ
            </Button>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            เพิ่มการจองคิว
          </Button>
        </div>

        {/* Add Booking Form */}
        {showAddForm && (
          <Card className="border-primary/20 bg-primary/5 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">จองคิวซ่อมใหม่</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              {motorcycles.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    คุณต้องเพิ่มข้อมูลรถจักรยานยนต์ก่อนจองคิว
                  </p>
                  <Link href="/motorcycles">
                    <Button variant="link" className="gap-2">
                      <Bike className="w-4 h-4" />
                      ไปที่หน้ารถจักรยานยนต์
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleAddBooking} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">เลือกรถ</label>
                      <select
                        className="w-full h-11 px-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                        value={form.motorcycle_id}
                        onChange={(e) =>
                          setForm({ ...form, motorcycle_id: e.target.value })
                        }
                      >
                        <option value="">-- กรุณาเลือกรถ --</option>
                        {motorcycles.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.brand} {m.model} ({m.license_plate})
                          </option>
                        ))}
                      </select>
                      {errors.motorcycle_id && (
                        <p className="text-xs text-destructive">
                          {errors.motorcycle_id}
                        </p>
                      )}
                    </div>

                    <Input
                      label="วันและเวลาที่จอง"
                      type="datetime-local"
                      value={form.booking_time}
                      onChange={(e) =>
                        setForm({ ...form, booking_time: e.target.value })
                      }
                      error={errors.booking_time}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      อาการเบื้องต้น / ข้อมูลเพิ่มเติม
                    </label>
                    <textarea
                      className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      placeholder="เช่น เปลี่ยนถ่ายน้ำมันเครื่อง, เคลมอะไหล่, ยางรั่ว..."
                      value={form.symptom_note}
                      onChange={(e) =>
                        setForm({ ...form, symptom_note: e.target.value })
                      }
                    />
                    {errors.symptom_note && (
                      <p className="text-xs text-destructive">
                        {errors.symptom_note}
                      </p>
                    )}
                  </div>

                  {serverError && (
                    <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      {serverError}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowAddForm(false)}
                    >
                      ยกเลิก
                    </Button>
                    <Button type="submit" loading={submitting}>
                      ยืนยันการจอง
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>กำลังโหลดข้อมูลการจอง...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-muted/20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              ยังไม่มีประวัติการจองคิวซ่อม
            </p>
            <Button variant="link" onClick={() => setShowAddForm(true)}>
              จองคิวซ่อมคันแรก
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {bookings.map((booking) => {
              const cfg = statusConfig[booking.status] || statusConfig.pending;
              const bookingDate = new Date(booking.booking_time);

              return (
                <Card
                  key={booking.id}
                  className="group hover:border-primary/30 transition-all"
                >
                  <CardContent className="p-0">
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Clock className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground">
                              {bookingDate.toLocaleDateString("th-TH", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </h4>
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                              <Loader2 className="w-3 h-3 text-primary animate-pulse" />{" "}
                              {/* Placeholder icon */}
                              {bookingDate.toLocaleTimeString("th-TH", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              น.
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Bike className="w-3.5 h-3.5" />
                              {booking.motorcycle.brand}{" "}
                              {booking.motorcycle.model} (
                              {booking.motorcycle.license_plate})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                        >
                          ดูรายละเอียด
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {booking.symptom_note && (
                      <div className="bg-muted/30 px-5 py-3 border-t border-border flex items-start gap-2">
                        <ClipboardList className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground italic truncate">
                          &quot;{booking.symptom_note}&quot;
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

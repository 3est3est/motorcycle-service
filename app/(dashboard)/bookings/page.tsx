"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Bike,
  AlertCircle,
  Loader2,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from "lucide-react";
import { bookingSchema, type BookingInput } from "@/lib/validations";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { th } from "date-fns/locale";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

interface AvailabilitySlot {
  time: string;
  label: string;
  available: boolean;
  bookingCount: number;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: {
    label: "รอยืนยัน",
    color: "text-amber-500 bg-amber-50 dark:bg-amber-900/10",
  },
  confirmed: {
    label: "ยืนยันแล้ว",
    color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10",
  },
  cancelled: {
    label: "ยกเลิก",
    color: "text-rose-500 bg-rose-50 dark:bg-rose-900/10",
  },
  completed: {
    label: "เสร็จสิ้น",
    color: "text-blue-500 bg-blue-50 dark:bg-blue-900/10",
  },
};

const AVAILABLE_HOURS = [8, 9, 10, 11, 13, 14, 15, 16];

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [form, setForm] = useState<BookingInput>({
    motorcycle_id: "",
    booking_time: "",
    symptom_note: "",
  });
  const [errors, setErrors] = useState<Partial<BookingInput>>({});
  const [serverError, setServerError] = useState("");

  // Queries
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
  });

  const { data: motorcycles = [] } = useQuery({
    queryKey: ["motorcycles"],
    queryFn: async () => {
      const res = await fetch("/api/motorcycles");
      if (!res.ok) throw new Error("Failed to fetch motorcycles");
      return res.json();
    },
  });

  const { data: availability, isLoading: isLoadingAvail } = useQuery({
    queryKey: ["availability", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/availability?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    },
    enabled: !!selectedDate,
  });

  // Derived Slots
  const slots: AvailabilitySlot[] = AVAILABLE_HOURS.map((h) => {
    const timeStr = `${String(h).padStart(2, "0")}:00`;
    const data = availability || { bookings: [], maxPerSlot: 3 };
    const count = (data.bookings || []).filter((b: string) => {
      const bDate = new Date(b);
      return bDate.getHours() === h;
    }).length;
    return {
      time: timeStr,
      label: `${h < 12 ? h : h === 12 ? 12 : h - 12}:00 ${h < 12 ? "น. (เช้า)" : "น. (บ่าย)"}`,
      available: count < (data.maxPerSlot || 3),
      bookingCount: count,
    };
  });

  // Mutator
  const createBooking = useMutation({
    mutationFn: async (data: BookingInput) => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create booking");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      if (selectedDate) {
        queryClient.invalidateQueries({
          queryKey: ["availability", selectedDate],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setShowAddForm(false);
      setForm({ motorcycle_id: "", booking_time: "", symptom_note: "" });
      setSelectedDate("");
      setSelectedTime("");
      setErrors({});
    },
    onError: (err: any) => {
      setServerError(err.message);
    },
  });

  // Sync form.booking_time whenever date or time changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
      const combinedDatetime = `${selectedDate}T${selectedTime}`;
      setForm((prev) => ({ ...prev, booking_time: combinedDatetime }));
    } else {
      setForm((prev) => ({ ...prev, booking_time: "" }));
    }
  }, [selectedDate, selectedTime]);

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

    // Check slot is available
    if (selectedTime) {
      const hour = parseInt(selectedTime.split(":")[0]);
      const slot = slots.find((s) => parseInt(s.time.split(":")[0]) === hour);
      if (slot && !slot.available) {
        setServerError("เวลานี้เต็มแล้ว กรุณาเลือกเวลาอื่น");
        return;
      }
    }

    createBooking.mutate(parsed.data);
  };

  // Generate next 14 days (excluding Sunday)
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i + 1);
    return d;
  }).filter((d) => d.getDay() !== 0); // exclude Sunday

  return (
    <div className="animate-fluid pb-20 max-w-6xl mx-auto">
      <TopBar title="การจองคิวซ่อม" subtitle="จองวันและเวลา หรือติดตามสถานะการซ่อม" />

      <div className="px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex bg-muted p-1 rounded-lg w-fit">
            <Button variant="ghost" size="sm" className="h-8 rounded-md bg-background shadow-sm px-4 text-xs font-bold">
              ทั้งหมด
            </Button>
            <Button variant="ghost" size="sm" className="h-8 rounded-md px-4 text-xs font-medium text-muted-foreground">
              ที่รอดำเนินการ
            </Button>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-11 px-6 rounded-xl font-bold gap-2 animate-in zoom-in-95 duration-300"
          >
            {showAddForm ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? "ยกเลิก" : "จองงานซ่อมใหม่"}
          </Button>
        </div>

        {/* Add Booking Form */}
        {showAddForm && (
          <Card className="border border-white/5 shadow-premium bg-card/40 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden rounded-4xl">
            <CardHeader className="bg-muted/10 pb-6 border-b border-white/5">
              <CardTitle className="text-xl font-black uppercase tracking-tight">จองคิวซ่อมใหม่</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">
                Book a Maintenance Service Slot
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {motorcycles.length === 0 ? (
                <div className="text-center py-12 space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                    <Bike className="w-8 h-8 text-muted-foreground opacity-40" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold">ไม่พบข้อมูลรถของคุณ</p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">คุณต้องลงทะเบียนรถจักรยายนต์ก่อนทำการจองคิวซ่อม</p>
                  </div>
                  <Button asChild variant="outline" className="h-11 rounded-xl px-8">
                    <Link href="/motorcycles">ไปที่หน้ารถของฉัน</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleAddBooking} className="space-y-10">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                      1. เลือกรถที่ต้องการซ่อม
                    </Label>
                    <Select value={form.motorcycle_id} onValueChange={(val) => setForm({ ...form, motorcycle_id: val })}>
                      <SelectTrigger className="h-14 bg-muted/30 border-none rounded-xl px-4 font-bold">
                        <SelectValue placeholder="-- เลือกรถของคุณ --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border shadow-lg">
                        {motorcycles.map((m: any) => (
                          <SelectItem key={m.id} value={m.id} className="font-medium p-3">
                            {m.brand} {m.model} ({m.license_plate})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.motorcycle_id && (
                      <p className="text-[10px] text-destructive font-bold uppercase tracking-wider px-1">{errors.motorcycle_id}</p>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* Date and Time Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                          2. เลือกวันที่ต้องการ
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full h-14 justify-start text-left font-bold bg-muted/30 border-none rounded-xl px-4",
                                !selectedDate && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-5 w-5 opacity-40" />
                              {selectedDate ? (
                                format(new Date(selectedDate), "EEEEที่ d MMMM yyyy", { locale: th })
                              ) : (
                                <span>คลิกเพื่อเลือกวันที่</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-2xl border shadow-premium overflow-hidden" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate ? new Date(selectedDate) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  setSelectedDate(format(date, "yyyy-MM-dd"));
                                  setSelectedTime("");
                                }
                              }}
                              disabled={(date) =>
                                date.getDay() === 0 || date < new Date(new Date().setHours(0, 0, 0, 0)) || date > addDays(new Date(), 30)
                              }
                              locale={th}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                          3. เลือกเวลาที่สะดวก
                        </Label>
                        {!selectedDate ? (
                          <div className="h-14 flex items-center px-4 rounded-xl bg-muted/10 border border-dashed border-white/5 opacity-50 text-xs font-medium">
                            กรุณาเลือกวันที่ก่อนเพื่อดูเวลาที่ว่าง
                          </div>
                        ) : (
                          <Select value={selectedTime} onValueChange={(val) => setSelectedTime(val)}>
                            <SelectTrigger className="h-14 bg-muted/30 border-none rounded-xl px-4 font-bold">
                              <SelectValue placeholder="-- เลือกช่วงเวลา --">
                                {selectedTime ? (
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{selectedTime} น.</span>
                                  </div>
                                ) : (
                                  "เลือกเวลา..."
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border shadow-lg">
                              {isLoadingAvail ? (
                                <div className="p-4 text-center">
                                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                                  <p className="text-[10px] font-bold uppercase">กำลังโหลด...</p>
                                </div>
                              ) : (
                                slots.map((slot) => (
                                  <SelectItem key={slot.time} value={slot.time} disabled={!slot.available} className="p-3">
                                    <div className="flex items-center justify-between w-full gap-4">
                                      <span className="font-bold">{slot.time} น.</span>
                                      <span
                                        className={cn(
                                          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                          slot.available ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500",
                                        )}
                                      >
                                        {slot.available ? "ว่าง" : "เต็ม"}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                        4. ข้อมูลเพิ่มเติม
                      </Label>
                      <Textarea
                        placeholder="อาการเบื้องต้น เช่น สตาร์ทไม่ติด, มีเสียงดังที่เครื่อง..."
                        className="min-h-[120px] bg-muted/30 border-none rounded-xl p-5 text-sm font-medium focus-visible:ring-primary/40"
                        value={form.symptom_note || ""}
                        onChange={(e) => setForm({ ...form, symptom_note: e.target.value })}
                      />
                    </div>
                  </div>

                  {serverError && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20 uppercase tracking-wide">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {serverError}
                    </div>
                  )}

                  <div className="flex gap-4 sm:justify-end pt-4 border-t">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowAddForm(false)}
                      className="h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-xs"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      disabled={createBooking.isPending}
                      className="h-12 flex-1 sm:flex-none sm:min-w-[240px] rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-md"
                    >
                      {createBooking.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "ยืนยันการจองคิวซ่อม"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bookings List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ประวัติการจองของคุณ</h3>
          </div>

          {isLoadingBookings ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-24 text-center border bg-muted/10 rounded-4xl border-dashed flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center opacity-20">
                <CalendarIcon className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold opacity-40 uppercase tracking-widest">ยังไม่มีรายการจองคิวซ่อม</p>
                <Button
                  variant="link"
                  className="text-primary font-black uppercase tracking-[0.2em] text-[10px]"
                  onClick={() => setShowAddForm(true)}
                >
                  จองคิวซ่อมครั้งแรก
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
              {bookings.map((booking: any) => {
                const cfg = statusConfig[booking.status] || statusConfig.pending;
                const bDate = new Date(booking.booking_time);
                return (
                  <Card
                    key={booking.id}
                    className="group hover:border-white/20 transition-all border border-white/5 bg-card/40 backdrop-blur-md shadow-premium active-prime rounded-2xl overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row items-stretch">
                        <div className="bg-muted/50 sm:w-24 p-6 flex sm:flex-col items-center justify-center gap-2 border-r">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            {format(bDate, "MMM", { locale: th })}
                          </span>
                          <span className="text-3xl font-black tracking-tighter leading-none">{format(bDate, "d")}</span>
                        </div>
                        <div className="flex-1 p-6 flex flex-col justify-between gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-[8px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 border-none",
                                  cfg.color,
                                )}
                              >
                                {cfg.label}
                              </Badge>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                                <span className="text-[11px] font-bold">{format(bDate, "HH:mm")} น.</span>
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-lg font-black tracking-tight leading-tight uppercase line-clamp-1">
                                {booking.motorcycle.brand} {booking.motorcycle.model}
                              </h4>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {booking.motorcycle.license_plate}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-muted">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-8 px-0 text-[10px] font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all"
                            >
                              <Link href={`/bookings/${booking.id}`}>
                                รายละเอียด <ChevronRight className="w-3.5 h-3.5 ml-1" />
                              </Link>
                            </Button>
                            {booking.status === "confirmed" && (
                              <Badge
                                variant="outline"
                                className="h-7 w-7 rounded-full p-0 flex items-center justify-center border-emerald-500/20 text-emerald-500"
                              >
                                <ClipboardList className="w-3.5 h-3.5" />
                              </Badge>
                            )}
                          </div>
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
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Bike,
  ChevronRight,
  Search,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number | { toNumber: () => number };
  method: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  repair_job: {
    id: string;
    booking: {
      motorcycle: {
        brand: string;
        model: string;
        license_plate: string;
      };
    };
  };
}

const paymentStatusConfig: Record<
  string,
  { label: string; variant: any; icon: any }
> = {
  pending: { label: "รอชำระเงิน", variant: "pending", icon: Clock },
  success: { label: "ชำระเงินแล้ว", variant: "completed", icon: CheckCircle2 },
  failed: { label: "ล้มเหลว", variant: "cancelled", icon: XCircle },
};

const methodLabels: Record<string, string> = {
  CASH: "เงินสด",
  TRANSFER: "โอนเงิน",
  QR_TRANSFER: "Thai QR",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/payments");
      if (res.ok) {
        setPayments(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch payments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const getAmount = (amount: any) => {
    if (typeof amount === "number") return amount;
    return typeof amount?.toNumber === "function"
      ? amount.toNumber()
      : Number(amount);
  };

  return (
    <div className="animate-fade-in">
      <TopBar
        title="การชำระเงิน"
        subtitle="จัดการบิลค่าใช้จ่ายและประวัติการชำระเงินของคุณ"
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full sm:w-72 h-10 pl-9 pr-4 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="ค้นหาเลขที่บิลหรือรถ..."
            />
          </div>
          <div className="flex bg-muted/50 p-1 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              className="bg-background shadow-sm h-8 rounded-md px-4 text-xs"
            >
              ทั้งหมด
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-md px-4 text-xs"
            >
              ค้างชำระ
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-md px-4 text-xs"
            >
              สำเร็จแล้ว
            </Button>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground">
            ประวัติการชำระเงินทั้งหมด
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p>กำลังโหลดข้อมูลการเงิน...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-muted/20 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">ยังไม่มีประวัติการทำรายการคัดเลือก</p>
            </div>
          ) : (
            payments.map((payment) => {
              const cfg =
                paymentStatusConfig[payment.status] ||
                paymentStatusConfig.pending;
              const Icon = cfg.icon;
              const amountValue = getAmount(payment.amount);

              return (
                <Card
                  key={payment.id}
                  className="group hover:border-primary/30 transition-all cursor-pointer"
                >
                  <CardContent className="p-0">
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            payment.status === "success"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground truncate">
                              #{payment.id.slice(-8).toUpperCase()}
                            </h4>
                            <Badge
                              variant={cfg.variant}
                              className="text-[10px] sm:text-xs"
                            >
                              {cfg.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                              <Receipt className="w-3.5 h-3.5" />
                              {methodLabels[payment.method] || payment.method}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Bike className="w-3.5 h-3.5" />
                              {payment.repair_job.booking.motorcycle.brand}{" "}
                              {payment.repair_job.booking.motorcycle.model}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(payment.created_at).toLocaleDateString(
                                "th-TH",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-4 sm:bg-muted/30 sm:px-4 sm:py-2 rounded-xl">
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-muted-foreground uppercase font-medium">
                            ยอดเงินรวม
                          </p>
                          <p className="text-lg font-bold text-foreground">
                            {formatCurrency(amountValue)}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

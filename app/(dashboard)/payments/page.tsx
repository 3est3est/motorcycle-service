import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "การชำระเงิน",
};

const mockPayments = [
  {
    id: "PAY-001",
    repairJobId: "RJ-0038",
    amount: 700,
    method: "QR_TRANSFER" as const,
    status: "success" as const,
    date: "12 ม.ค. 2569",
  },
];

const pendingPayments = [
  {
    repairJobId: "RJ-0042",
    amount: 2800,
    dueDate: "เมื่อรับรถ",
  },
];

const methodLabel: Record<string, string> = {
  CASH: "เงินสด",
  TRANSFER: "โอนเงิน",
  QR_TRANSFER: "QR Code",
};

export default function PaymentsPage() {
  return (
    <div className="animate-fade-in">
      <TopBar title="การชำระเงิน" subtitle="ประวัติและรายการค้างชำระ" />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Pending payments */}
        {pendingPayments.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">
              รอชำระเงิน
            </h2>
            <div className="space-y-3">
              {pendingPayments.map((p) => (
                <Card
                  key={p.repairJobId}
                  className="border-warning/30 bg-warning/5"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {p.repairJobId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            กำหนดชำระ: {p.dueDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-xl text-foreground">
                          ฿{p.amount.toLocaleString("th-TH")}
                        </p>
                        <Button size="sm" id={`pay-${p.repairJobId}`}>
                          ชำระเงิน
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Payment history */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            ประวัติการชำระเงิน
          </h2>
          <Card>
            {mockPayments.map((payment, idx) => (
              <CardContent
                key={payment.id}
                className={`p-4 ${idx < mockPayments.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {payment.repairJobId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.date} · {methodLabel[payment.method]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="success">ชำระแล้ว</Badge>
                    <p className="font-bold text-foreground">
                      ฿{payment.amount.toLocaleString("th-TH")}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      id={`view-payment-${payment.id}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            ))}
            {mockPayments.length === 0 && (
              <CardContent className="py-12 text-center text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">ยังไม่มีประวัติการชำระเงิน</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

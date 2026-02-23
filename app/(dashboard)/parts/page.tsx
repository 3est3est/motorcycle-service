import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Plus, Edit2, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "คลังอะไหล่",
};

const mockParts = [
  {
    id: "p-001",
    name: "ผ้าเบรกหน้า",
    description: "Honda PCX ปี 2020-2023",
    price: 350,
    stock: 8,
  },
  {
    id: "p-002",
    name: "น้ำมันเครื่อง 10W-40",
    description: "1 ลิตร",
    price: 180,
    stock: 24,
  },
  {
    id: "p-003",
    name: "สายโซ่",
    description: "ขนาด 420-420",
    price: 450,
    stock: 2,
  },
  {
    id: "p-004",
    name: "หัวเทียน NGK",
    description: "CR8E",
    price: 95,
    stock: 0,
  },
];

function stockStatus(qty: number) {
  if (qty === 0) return { label: "หมดสต๊อก", variant: "destructive" as const };
  if (qty <= 3) return { label: "ใกล้หมด", variant: "warning" as const };
  return { label: "พร้อมจำหน่าย", variant: "success" as const };
}

export default function PartsPage() {
  return (
    <div className="animate-fade-in">
      <TopBar title="คลังอะไหล่" subtitle="จัดการสต๊อกอะไหล่" />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Low stock warning */}
        {mockParts.some((p) => p.stock <= 3) && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground text-sm">
                แจ้งเตือนสต๊อกต่ำ
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                มีอะไหล่ {mockParts.filter((p) => p.stock <= 3).length}{" "}
                รายการที่ใกล้หมดหรือหมดสต๊อก
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            พบ <strong>{mockParts.length}</strong> รายการ
          </p>
          <Button className="gap-2 w-full sm:w-auto" id="add-part-btn">
            <Plus className="w-4 h-4" />
            เพิ่มอะไหล่ใหม่
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {mockParts.map((part) => {
            const { label, variant } = stockStatus(part.stock);
            return (
              <Card
                key={part.id}
                className={`group hover:shadow-md transition-all hover:border-primary/20 ${
                  part.stock === 0 ? "opacity-70" : ""
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <Badge variant={variant}>{label}</Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-0.5">
                    {part.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {part.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">ราคา</p>
                      <p className="font-bold text-foreground">
                        ฿{part.price.toLocaleString("th-TH")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">คงเหลือ</p>
                      <p
                        className={`font-bold ${part.stock === 0 ? "text-destructive" : part.stock <= 3 ? "text-warning" : "text-foreground"}`}
                      >
                        {part.stock} ชิ้น
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    id={`edit-part-${part.id}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    แก้ไขข้อมูล
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Bike, Edit2, Trash2, Calendar } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "รถจักรยานยนต์ของฉัน",
};

const mockMotorcycles = [
  {
    id: "mc-001",
    brand: "ฮอนด้า",
    model: "PCX 150",
    licensePlate: "ทต 4521 กทม",
    year: 2022,
    color: "สีขาว-น้ำเงิน",
  },
  {
    id: "mc-002",
    brand: "ยามาฮ่า",
    model: "NMAX 155",
    licensePlate: "กก 5555 กทม",
    year: 2021,
    color: "สีดำ",
  },
];

export default function MotorcyclesPage() {
  return (
    <div className="animate-fade-in">
      <TopBar title="รถจักรยานยนต์" subtitle="จัดการข้อมูลรถของคุณ" />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            พบ <strong>{mockMotorcycles.length}</strong> คัน
          </p>
          <Button className="gap-2 w-full sm:w-auto" id="add-motorcycle-btn">
            <Plus className="w-4 h-4" />
            เพิ่มรถใหม่
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {mockMotorcycles.map((moto) => (
            <Card
              key={moto.id}
              className="group hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Bike className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      id={`edit-motorcycle-${moto.id}`}
                      aria-label="แก้ไขข้อมูล"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                      id={`delete-motorcycle-${moto.id}`}
                      aria-label="ลบรถ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <h3 className="font-bold text-foreground text-lg mb-0.5">
                  {moto.brand} {moto.model}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-sm bg-muted px-2.5 py-1 rounded-md font-medium">
                    {moto.licensePlate}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ปี {moto.year}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {moto.color}
                </p>

                {/* Action */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  id={`book-motorcycle-${moto.id}`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  จองคิวซ่อม
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Add card */}
          <button
            className="group border-2 border-dashed border-border rounded-xl p-5 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-center flex flex-col items-center justify-center gap-3 min-h-[180px]"
            id="add-motorcycle-card-btn"
          >
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                เพิ่มรถใหม่
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                คลิกเพื่อเพิ่มรถจักรยานยนต์
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

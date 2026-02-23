import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bike, Wrench, Star, Clock, Shield, ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Bike className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-foreground text-sm">
                ป่าโยว์เย่ การช่าง
              </span>
              <p className="text-[10px] text-muted-foreground leading-none hidden sm:block">
                ระบบจัดการร้านซ่อม
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                เข้าสู่ระบบ
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">สมัครสมาชิก</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20 sm:pt-32 sm:pb-28 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-primary/8 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            ระบบบริหารร้านซ่อมออนไลน์ครบวงจร
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            จัดการทุกอย่างของ <span className="text-primary">ร้านซ่อม</span>
            <br />
            ได้ในที่เดียว
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            จองคิวซ่อม ติดตามสถานะงาน ดูใบเสนอราคา ชำระเงิน และสะสมคะแนน
            ทั้งหมดผ่านสมาร์ทโฟนหรือคอมพิวเตอร์ของคุณ
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button
                size="lg"
                className="gap-2 text-base px-8 w-full sm:w-auto"
              >
                เริ่มใช้งานฟรี
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="text-base w-full sm:w-auto"
              >
                เข้าสู่ระบบ
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              ฟีเจอร์ครบครัน
            </h2>
            <p className="text-muted-foreground text-lg">
              ออกแบบมาเพื่อร้านซ่อมรถมอเตอร์ไซค์โดยเฉพาะ
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Calendar2,
                title: "จองคิวออนไลน์",
                desc: "ลูกค้าจองคิวซ่อมล่วงหน้าได้ตลอด 24 ชม. เลือกวันเวลาที่สะดวก",
              },
              {
                icon: Wrench,
                title: "ติดตามงานซ่อม",
                desc: "ดูสถานะงานซ่อม ใบประเมินราคา และใบเสนอราคาแบบเรียลไทม์",
              },
              {
                icon: Star,
                title: "สะสมคะแนน",
                desc: "รับแต้มสะสมอัตโนมัติทุกครั้งที่ใช้บริการ แลกรับสิทธิประโยชน์",
              },
              {
                icon: Shield,
                title: "ปลอดภัยสูง",
                desc: "ระบบรักษาความปลอดภัยด้วย RBAC และ JWT ทุกการเข้าถึง",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: "33", label: "ฟีเจอร์ระบบ" },
              { value: "3", label: "ระดับสิทธิ์" },
              { value: "99%", label: "Uptime" },
              { value: "24/7", label: "ออนไลน์ตลอดเวลา" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-4xl font-bold text-primary mb-1">
                  {value}
                </div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            เริ่มต้นใช้งานวันนี้
          </h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            สมัครสมาชิกฟรี จัดการร้านซ่อมของคุณให้เป็นระบบ
          </p>
          <Link href="/register">
            <Button
              variant="outline"
              size="lg"
              className="bg-white text-primary hover:bg-white/90 border-0 font-semibold"
            >
              สมัครสมาชิกฟรี
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                <Bike className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm text-muted-foreground">
                ป่าโยว์เย่ การช่าง
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ระบบจัดการร้านซ่อมรถจักรยานยนต์
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Icon shorthand
function Calendar2({ className }: { className?: string }) {
  return <Clock className={className} />;
}

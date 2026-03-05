import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bike, CheckCircle2, ChevronRight, Clock, MapPin, Phone, Search, Shield, Sparkles, Wrench } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-sky-500/5 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 text-primary-foreground">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tighter">
                ป่าโยว์เย่ <span className="text-primary italic">การช่าง</span>
              </span>
              <p className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-[0.2em] leading-none mt-0.5">
                Professional Workshop
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-4 border-r border-white/10 pr-2 sm:pr-4 mr-2 sm:mr-0">
              <Link href="/login" className="hidden sm:block">
                <Button
                  variant="ghost"
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  เข้าสู่ระบบ
                </Button>
              </Link>
              <ThemeToggle />
            </div>
            <Link href="/register">
              <Button className="rounded-2xl px-6 font-black uppercase tracking-widest text-[10px] h-11 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                จองคิวซ่อม
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Sparkles className="w-3.5 h-3.5" />
            ดูแลรถของคุณด้วยมาตรฐานระดับมืออาชีพ
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[1.05] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            วางใจให้เรา <br className="hidden sm:block" />
            <span className="text-primary italic">ดูแล</span> มอเตอร์ไซค์ของคุณ
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-medium">
            ยินดีต้อนรับสู่ ป่าโยว์เย่ การช่าง ศูนย์บริการซ่อมรถจักรยานยนต์ครบวงจร ระบบจองคิวออนไลน์ ติดตามสถานะได้ทันที
            พร้อมประวัติการซ่อมแบบดิจิทัล
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-sm gap-2 shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
              >
                จองนัดหมายออนไลน์
                <ChevronRight className="w-4 h-4 text-white" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-sm border-white/10 bg-white/5 hover:bg-white/10 transition-all gap-2"
              >
                <Search className="w-4 h-4" />
                เช็คสถานะงานซ่อม
              </Button>
            </Link>
          </div>
        </section>

        {/* Core Services Grid */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ServiceCard
              icon={Wrench}
              title="ซ่อมเช็คระยะ"
              desc="เปลี่ยนถ่ายน้ำมันเครื่อง แบตเตอรี่ และตรวจสอบระบบรถตามระยะมาตรฐาน"
              delay="delay-0"
            />
            <ServiceCard
              icon={Bike}
              title="แก้ไขเครื่องยนต์"
              desc="วิเคราะห์อาการและซ่อมอัพเกรดเครื่องยนต์ โดยทีมช่างผู้ชำนาญการ"
              delay="delay-75"
            />
            <ServiceCard
              icon={Clock}
              title="จองคิวง่าย"
              desc="ไม่ต้องรอนานที่หน้าร้าน จองเวลาที่สะดวกผ่านระบบออนไลน์ 24 ชม."
              delay="delay-150"
            />
            <ServiceCard
              icon={CheckCircle2}
              title="อะไหล่แท้"
              desc="เราเลือกใช้เฉพาะอะไหล่คุณภาพที่ได้มาตรฐาน เพื่อความคงทนและปลอดภัย"
              delay="delay-225"
            />
          </div>
        </section>

        {/* Shop Info Container */}
        <section className="py-24 px-6 max-w-7xl mx-auto border-y border-white/5 relative bg-white/2 overflow-hidden rounded-4xl mb-24">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            <div className="lg:col-span-7 space-y-8">
              <h2 className="text-4xl font-black tracking-tighter leading-tight">
                สะดวกสบายยิ่งขึ้น <br />
                สำหรับ <span className="text-primary italic">ลูกค้าคนพิเศษ</span>
              </h2>
              <div className="space-y-6">
                <BenefitItem
                  icon={Shield}
                  title="ประวัติงานซ่อม"
                  desc="เข้าดูประวัติการซ่อมย้อนหลังได้ทุกชิ้นส่วน ให้คุณทราบถึงเวลาที่ต้องดูแลรถอีกครั้ง"
                />
                <BenefitItem
                  icon={Sparkles}
                  title="ระบบสะสมคะแนน"
                  desc="ทุกรายการซ่อมที่ ป่าโยว์เย่ รับแต้มสะสมทันทีเพื่อแลกรับส่วนลดและสิทธิพิเศษในอนาคต"
                />
              </div>
            </div>
            <div className="lg:col-span-5 grid grid-cols-1 gap-4">
              <div className="p-8 rounded-3xl bg-card border border-white/5 shadow-premium space-y-4">
                <div className="flex items-center gap-4">
                  <MapPin className="text-primary w-6 h-6" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Location</p>
                    <p className="font-black text-sm">ตั้งอยู่ย่านชุมชน เดินทางสะดวก</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="text-primary w-6 h-6" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Contact</p>
                    <p className="font-black text-sm">ติดต่อสอบถาม: 0xx-xxx-xxxx</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="pb-32 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-primary/10 to-transparent opacity-50" />
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl font-black tracking-tighter">พร้อมรับบริการที่ดีที่สุดแล้วหรือยัง?</h2>
            <Link href="/register">
              <Button
                size="lg"
                className="h-16 px-12 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
              >
                สร้างบัญชี และจองคิวซ่อมเลย
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Bike className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-xs text-muted-foreground/60 tracking-wider">© PA YO YE WORKSHOP</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-[10px] font-black text-muted-foreground/30 hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-[10px] font-black text-muted-foreground/30 hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({ icon: Icon, title, desc, delay }: any) {
  return (
    <div
      className={cn(
        "group p-8 rounded-4xl border border-white/5 bg-card/40 backdrop-blur-md hover:bg-primary/5 transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4",
        delay,
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-muted outline-2 outline-white/5 flex items-center justify-center mb-6 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 shadow-inner">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-black tracking-tight mb-3 group-hover:text-primary transition-colors leading-tight">{title}</h3>
      <p className="text-sm text-muted-foreground/60 leading-relaxed font-bold">{desc}</p>
    </div>
  );
}

function BenefitItem({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex items-start gap-5 group">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-current transition-all">
        <Icon className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground/80">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}

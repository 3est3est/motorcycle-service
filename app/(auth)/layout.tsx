import type { Metadata } from "next";
import { Bike } from "lucide-react";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ / สมัครสมาชิก",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-sidebar flex-col justify-between p-12 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-white/5 rounded-full" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Bike className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-lg">ป่าโยว์เย่ การช่าง</p>
            <p className="text-xs text-white/50">
              ระบบจัดการร้านซ่อมรถจักรยานยนต์
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="relative">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            บริหารร้านซ่อม
            <br />
            <span className="text-primary">อย่างมืออาชีพ</span>
          </h2>
          <p className="text-white/60 text-lg leading-relaxed mb-8">
            ระบบครบวงจรสำหรับจัดการการจอง งานซ่อม อะไหล่ และการเงิน
            ของร้านซ่อมรถจักรยานยนต์
          </p>

          <div className="space-y-3">
            {[
              "จองคิวซ่อมออนไลน์ 24 ชั่วโมง",
              "ติดตามสถานะงานซ่อมแบบเรียลไทม์",
              "ระบบคะแนนสะสมสำหรับลูกค้า",
              "บริหารสต๊อกอะไหล่อัตโนมัติ",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/70">
                <span className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                </span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/30 text-sm">
          © {new Date().getFullYear()} ป่าโยว์เย่ การช่าง
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Bike className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">
              ป่าโยว์เย่ การช่าง
            </span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

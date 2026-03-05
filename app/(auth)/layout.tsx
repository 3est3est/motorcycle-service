import type { Metadata } from "next";
import { Bike, ShieldCheck, Zap, Heart, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ / สมัครสมาชิก | MTD Mortocyc",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel - branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative bg-primary flex-col justify-between p-16 overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-background/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center shadow-2xl">
            <Bike className="w-6 h-6 text-primary" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-black text-white text-2xl tracking-tight uppercase leading-none">
              ป่าโยว์เย่
            </p>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em] mt-1">
              Motorcycle Service System
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="relative max-w-xl">
          <h2 className="text-6xl font-black text-white mb-8 leading-[0.9] tracking-tighter">
            ELEVATE YOUR <br />
            <span className="text-white/40">WORKSHOP.</span>
          </h2>
          <p className="text-white/60 text-lg font-medium leading-relaxed mb-12">
            ระบบบริหารจัดการร้านซ่อมรถจักรยานยนต์ที่ทันสมัยที่สุด
            ครบจบในที่เดียว ทั้งงานซ่อม คลังอะไหล่ และการเงิน
          </p>

          <div className="grid grid-cols-2 gap-6">
            {[
              { label: "Real-time Tracking", icon: Zap },
              { label: "Inventory Auto-sync", icon: ShieldCheck },
              { label: "Loyalty Program", icon: Heart },
              { label: "Expert Management", icon: Sparkles },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 text-white/80 p-4 rounded-2xl bg-white/5 border border-white/10"
              >
                <item.icon className="w-5 h-5 text-white" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/30 text-[10px] font-bold uppercase tracking-[0.3em]">
          © {new Date().getFullYear()} ป่าโยว์เย่ การช่าง • PRYME ENGINE
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 relative">
        {/* Decorative flair for minimal look */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Bike className="w-64 h-64 -rotate-12" />
        </div>

        <div className="w-full max-w-md animate-fluid relative">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-foreground text-lg leading-none">
                ป่าโยว์เย่
              </p>
              <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                Workshop System
              </p>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}

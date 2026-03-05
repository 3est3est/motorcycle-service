"use client";

import { useSidebar } from "@/components/providers/sidebar-provider";
import { cn } from "@/lib/utils";

export function DashboardMain({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <main
      className={cn("relative transition-all duration-500 ease-in-out pb-20 lg:pb-0 min-h-screen", isCollapsed ? "lg:pl-20" : "lg:pl-64")}
    >
      {/* Background Aesthetic */}
      <div className="fixed inset-0 -z-10 bg-background overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/3 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/3 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[32px_32px] opacity-[0.03]" />
      </div>

      <div className="relative z-10 w-full">{children}</div>
    </main>
  );
}

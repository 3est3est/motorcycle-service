"use client";

import { cn } from "@/lib/utils";
import { Bell, Search, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";

interface TopBarProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function TopBar({ title, subtitle, className }: TopBarProps) {
  const router = useRouter();

  const toggleTheme = async () => {
    await fetch("/api/theme", { method: "POST" });
    router.refresh();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center gap-4 px-4 sm:px-6 py-3",
        "bg-background/80 backdrop-blur-xl border-b border-border/50",
        "pl-16 lg:pl-6",
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs font-medium text-muted-foreground/80 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search (desktop) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-secondary/50 border border-border/40 rounded-xl text-sm text-muted-foreground w-48 lg:w-72 cursor-text group hover:border-primary/30 transition-all">
          <Search className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-muted-foreground">
            ค้นหาบางอย่าง...
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all flex items-center justify-center min-h-[40px] min-w-[40px]"
            aria-label="เปลี่ยนธีม"
          >
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 block dark:hidden" />
          </button>

          {/* Notification */}
          <button
            className="relative p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all flex items-center justify-center min-h-[40px] min-w-[40px]"
            aria-label="การแจ้งเตือน"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-background" />
          </button>
        </div>
      </div>
    </header>
  );
}

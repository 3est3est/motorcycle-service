"use client";

import { cn } from "@/lib/utils";
import { Bell, Search } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function TopBar({ title, subtitle, className }: TopBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center gap-4 px-4 sm:px-6 py-4",
        "bg-background/90 backdrop-blur-sm border-b border-border",
        "pl-16 lg:pl-6",
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-foreground truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search (desktop) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground w-48 lg:w-64 cursor-text">
          <Search className="w-4 h-4 flex-shrink-0" />
          <span>ค้นหา...</span>
        </div>

        {/* Notification */}
        <button
          className="relative p-2 rounded-lg hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="การแจ้งเตือน"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  );
}

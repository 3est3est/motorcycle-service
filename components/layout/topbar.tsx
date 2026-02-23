"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Search,
  Moon,
  Sun,
  Wrench,
  Package,
  CheckCircle2,
  Clock,
  ArrowRight,
  PartyPopper,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { RepairStatusModal } from "@/app/(dashboard)/dashboard/repair-status-modal";

interface TopBarProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function TopBar({ title, subtitle, className }: TopBarProps) {
  const router = useRouter();
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);
  const [prevConfirmedIds, setPrevConfirmedIds] = useState<Set<string>>(
    new Set(),
  );

  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 10000,
  });

  const toggleTheme = async () => {
    await fetch("/api/theme", { method: "POST" });
    router.refresh();
  };

  const notifications = [];

  // Logic to build notifications for CUSTOMER
  if (dashboardData?.activeRepairs) {
    dashboardData.activeRepairs.forEach((rj: any) => {
      if (!rj.customer_confirmed && rj.booking.estimate) {
        notifications.push({
          id: `estimate-${rj.id}`,
          title: "ราคาประเมินมาแล้ว!",
          description: `รถ ${rj.booking.motorcycle.model} ประเมินเสร็จแล้ว กรุณายืนยัน`,
          icon: Wrench,
          color: "text-amber-500",
          action: () => setSelectedRepairId(rj.id),
        });
      }
      if (rj.status === "completed") {
        notifications.push({
          id: `completed-${rj.id}`,
          title: "ซ่อมเสร็จแล้ว!",
          description: `รถ ${rj.booking.motorcycle.model} ซ่อมเสร็จเรียบร้อย พร้อมส่งมอบ`,
          icon: CheckCircle2,
          color: "text-emerald-500",
          action: () => setSelectedRepairId(rj.id),
        });
      }
    });
  }

  // Logic to build notifications for STAFF
  const repairsData = useQuery({
    queryKey: ["repairs"],
    queryFn: async () => {
      const res = await fetch("/api/staff/repairs");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: dashboardData && !dashboardData.activeRepairs, // Only for staff
    refetchInterval: 5000,
  });

  if (dashboardData && !dashboardData.activeRepairs) {
    // 1. New Booking notification
    if (dashboardData.stats?.confirmedBookings > 0) {
      notifications.push({
        id: "staff-pending",
        title: "มีคิวรถรอรับเครื่อง",
        description: `มี ${dashboardData.stats.confirmedBookings} คิวที่ยืนยันแล้ว รอเข้าซ่อม`,
        icon: Clock,
        color: "text-blue-500",
        action: () => router.push("/admin"),
      });
    }

    // 2. Customer Confirmation Notification for STAFF
    const confirmedRepairs = (repairsData.data || []).filter(
      (r: any) => r.customer_confirmed,
    );

    confirmedRepairs.forEach((rj: any) => {
      notifications.push({
        id: `staff-confirm-${rj.id}`,
        title: "ลูกค้ายืนยันการซ่อม!",
        description: `คุณ ${rj.booking.customer.full_name} อนุมัติการซ่อมรถ ${rj.booking.motorcycle.model} แล้ว`,
        icon: PartyPopper,
        color: "text-pink-500 font-bold animate-bounce",
        action: () => {
          // If we had a way to open the modal directly from here, it would be better.
          // For now, redirect to repair-jobs.
          router.push("/repair-jobs");
        },
      });
    });
  }

  const hasUnread = notifications.length > 0;

  return (
    <>
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
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-secondary/50 border border-border/40 rounded-xl text-sm text-muted-foreground w-48 lg:w-72 cursor-text group hover:border-primary/30 transition-all">
            <Search className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            <span className="group-hover:text-muted-foreground">
              ค้นหาบางอย่าง...
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all flex items-center justify-center min-h-[40px] min-w-[40px]"
              aria-label="เปลี่ยนธีม"
            >
              <Sun className="w-5 h-5 hidden dark:block" />
              <Moon className="w-5 h-5 block dark:hidden" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="relative p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all flex items-center justify-center min-h-[40px] min-w-[40px]"
                  aria-label="การแจ้งเตือน"
                >
                  <Bell className="w-5 h-5" />
                  {hasUnread && (
                    <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-background animate-pulse" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 rounded-2xl p-2 bg-popover/95 backdrop-blur-xl border-border/40 shadow-2xl"
              >
                <DropdownMenuLabel className="px-4 py-3 flex items-center justify-between">
                  <span className="font-black text-xs uppercase tracking-widest opacity-50">
                    แจ้งเตือนใหม่
                  </span>
                  {hasUnread && (
                    <Badge
                      variant="success"
                      className="rounded-full px-2 py-0 text-[10px]"
                    >
                      {notifications.length}
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/30 mx-2" />

                {notifications.length === 0 ? (
                  <div className="py-12 text-center space-y-3 opacity-40">
                    <Bell className="w-12 h-12 mx-auto stroke-[1.5]" />
                    <p className="text-[10px] font-bold uppercase tracking-widest px-8">
                      ยังไม่มีแจ้งเตือนใหม่ในขณะนี้
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[70vh] overflow-y-auto py-1">
                    {notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        onClick={n.action}
                        className="p-4 rounded-xl cursor-pointer hover:bg-primary/5 focus:bg-primary/5 flex items-start gap-4 transition-all group"
                      >
                        <div
                          className={cn(
                            "mt-1 p-2 rounded-lg bg-current/10 shrink-0",
                            n.color,
                          )}
                        >
                          <n.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">
                            {n.title}
                          </p>
                          <p className="text-xs text-muted-foreground font-medium leading-relaxed mt-1">
                            {n.description}
                          </p>
                        </div>
                        <ArrowRight className="w-3 h-3 self-center opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}

                <DropdownMenuSeparator className="bg-border/30 mx-2" />
                <DropdownMenuItem className="w-full justify-center p-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                  ทำเครื่องหมายว่าอ่านแล้วทั้งหมด
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <RepairStatusModal
        repairId={selectedRepairId}
        onClose={() => setSelectedRepairId(null)}
      />
    </>
  );
}

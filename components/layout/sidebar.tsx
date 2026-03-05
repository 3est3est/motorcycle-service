"use client";

import { cn } from "@/lib/utils";
import {
  Compass,
  Calendar,
  Hammer,
  Boxes,
  ReceiptText,
  Sparkles,
  Users,
  Settings,
  Bike,
  LogOut,
  Menu,
  Files,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  History,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { useSidebar } from "@/components/providers/sidebar-provider";

import { logoutAction } from "@/lib/actions/auth";
import { useProfile } from "@/lib/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

type UserRole = "customer" | "staff" | "admin";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "แดชบอร์ด",
    icon: Compass,
    roles: ["customer", "staff", "admin"],
  },
  {
    href: "/bookings",
    label: "จองซ่อม",
    icon: Calendar,
    roles: ["customer"],
  },
  {
    href: "/admin",
    label: "จัดการคิวจอง",
    icon: Calendar,
    roles: ["staff", "admin"],
  },
  {
    href: "/motorcycles",
    label: "รถจักรยานยนต์",
    icon: Bike,
    roles: ["customer", "staff", "admin"],
  },
  {
    href: "/estimates",
    label: "ใบประเมินราคา",
    icon: Files,
    roles: ["customer"],
  },
  {
    href: "/quotations",
    label: "ใบเสนอราคา",
    icon: Files,
    roles: ["customer", "staff", "admin"],
  },
  {
    href: "/repair-jobs",
    label: "งานซ่อม",
    icon: Hammer,
    roles: ["staff", "admin"],
  },
  {
    href: "/parts",
    label: "คลังอะไหล่",
    icon: Boxes,
    roles: ["staff", "admin"],
  },
  {
    href: "/payments",
    label: "การชำระเงิน",
    icon: ReceiptText,
    roles: ["customer", "staff", "admin"],
  },
  {
    href: "/points",
    label: "คะแนนสะสม",
    icon: Sparkles,
    roles: ["customer"],
  },
  {
    href: "/users",
    label: "ผู้ใช้งาน",
    icon: Users,
    roles: ["staff", "admin"],
  },
  {
    href: "/profile",
    label: "ตั้งค่าบัญชี",
    icon: Settings,
    roles: ["customer", "staff", "admin"],
  },
];

interface SidebarProps {
  role?: UserRole;
  userEmail?: string;
  userName?: string;
  userId: string;
}

export function Sidebar({ role: initialRole = "customer" }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isCollapsed, toggle } = useSidebar();

  // Use real-time profile data
  const { data: profile } = useProfile();
  const role = profile?.role || initialRole;
  const userName = profile?.full_name;

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  const roleLabel = {
    customer: "ลูกค้า",
    staff: "พนักงาน",
    admin: "ผู้ดูแลระบบ",
  }[role];

  const SidebarInner = ({ onItemClick }: { onItemClick?: () => void }) => {
    const [isPending, startTransition] = useTransition();

    const handleLogout = async () => {
      if (isPending) return;
      try {
        localStorage.clear();
        sessionStorage.clear();
        startTransition(async () => {
          try {
            await logoutAction();
          } catch (err) {
            window.location.replace("/login");
          }
        });
      } catch (err) {
        window.location.replace("/login");
      }
    };

    return (
      <div className="flex flex-col h-full bg-card relative">
        {/* Toggle Button - Desktop Only */}
        <button
          onClick={toggle}
          className={cn(
            "hidden lg:flex absolute -right-3 top-24 w-6 h-6 rounded-full bg-primary text-primary-foreground items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all duration-300 z-50 border-4 border-background group",
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          ) : (
            <ChevronLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
          )}
        </button>

        {/* Brand Header */}
        <div className={cn("p-8 transition-all duration-500", isCollapsed ? "px-4 overflow-hidden" : "px-8")}>
          <Link href="/dashboard" className="flex items-center gap-4 group">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground group-hover:rotate-6 transition-all duration-500 shadow-md">
              <Bike className="w-7 h-7" />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                <h1 className="font-black text-xl tracking-tighter leading-none group-hover:text-primary transition-colors">
                  ป่าโยว์เย่ การช่าง
                </h1>
                <p className="text-[9px] uppercase font-black text-muted-foreground/50 mt-1.5 tracking-widest leading-none">
                  COMMAND CENTER
                </p>
              </div>
            )}
          </Link>
        </div>

        <div className={cn("flex-1 py-8 overflow-y-auto space-y-1.5 transition-all duration-500", isCollapsed ? "px-3" : "px-4")}>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-4 h-11 text-[13px] font-black uppercase tracking-widest transition-all duration-300 rounded-xl group/btn overflow-hidden",
                  isCollapsed ? "px-0 justify-center" : "px-4",
                  isActive
                    ? "bg-primary text-white shadow-md hover:bg-primary/90"
                    : "text-muted-foreground/60 hover:text-primary hover:bg-primary/5 active:scale-95",
                )}
                onClick={onItemClick}
              >
                <Link href={item.href}>
                  <Icon
                    className={cn("w-5 h-5 shrink-0 transition-all duration-500", isActive ? "scale-110" : "group-hover/btn:scale-110")}
                    strokeWidth={isActive ? 3 : 2}
                  />
                  {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
                  {isActive && !isCollapsed && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20" />}
                </Link>
              </Button>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className={cn("mt-auto transition-all duration-500", isCollapsed ? "p-3" : "p-4")}>
          <div
            className={cn(
              "p-4 rounded-2xl bg-muted/20 border border-muted-foreground/5 mb-4 group/user transition-all duration-500 backdrop-blur-sm",
              isCollapsed ? "p-2 mb-2" : "p-4 mb-4",
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0 shadow-md ring-2 ring-background group-hover/user:ring-primary/20 transition-all">
                <AvatarImage src={profile?.image_url} className="object-cover" />
                <AvatarFallback className="bg-primary/5 text-primary/40">
                  <CircleUserRound strokeWidth={2.5} className="w-5 h-5 font-black" />
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="min-w-0 flex-1 animate-in fade-in slide-in-from-left-2 duration-500">
                  <p className="text-sm font-black truncate leading-tight">{userName ?? "ผู้ใช้งาน"}</p>
                  <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">{roleLabel}</p>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-destructive/50 hover:text-destructive hover:bg-destructive/5 h-11 rounded-xl transition-all duration-300 group/logout",
              isCollapsed && "px-0 justify-center",
            )}
            onClick={handleLogout}
            disabled={isPending}
          >
            <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover/logout:-translate-x-1" />
            {!isCollapsed && (
              <span className="text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">
                {isPending ? "กำลังออก..." : "ออกจากระบบ"}
              </span>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Top Bar / Trigger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
            <Bike className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">ป่าโยว์เย่ การช่าง</span>
        </div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-none">
            <SheetHeader className="sr-only">
              <SheetTitle>เมนูนำทาง</SheetTitle>
            </SheetHeader>
            <SidebarInner onItemClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <aside
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 bg-card flex-col z-50 transition-all duration-500 ease-in-out",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        <SidebarInner />
      </aside>

      {/* Mobile Bottom Navigation (NFR-09: One-finger access) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-lg z-50 px-4 flex items-center justify-around pb-safe">
        {filteredItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[64px] transition-all active:scale-90",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <div className={cn("p-1.5 rounded-lg", isActive && "bg-primary/10")}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

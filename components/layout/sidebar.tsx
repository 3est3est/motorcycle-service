"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Wrench,
  Package,
  CreditCard,
  Star,
  Users,
  Settings,
  ChevronLeft,
  Bike,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type UserRole = "customer" | "staff" | "admin";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "แดชบอร์ด",
    icon: LayoutDashboard,
    roles: ["customer", "staff", "admin"],
  },
  {
    href: "/bookings",
    label: "การจองคิวซ่อม",
    icon: Calendar,
    roles: ["customer", "staff", "admin"],
  },
  {
    href: "/motorcycles",
    label: "รถจักรยานยนต์",
    icon: Bike,
    roles: ["customer", "staff", "admin"],
  },
  {
    href: "/repair-jobs",
    label: "งานซ่อม",
    icon: Wrench,
    roles: ["staff", "admin"],
  },
  {
    href: "/parts",
    label: "คลังอะไหล่",
    icon: Package,
    roles: ["staff", "admin"],
  },
  {
    href: "/payments",
    label: "การชำระเงิน",
    icon: CreditCard,
    roles: ["customer", "staff", "admin"],
  },
  {
    href: "/points",
    label: "คะแนนสะสม",
    icon: Star,
    roles: ["customer"],
  },
  {
    href: "/admin",
    label: "จัดการผู้ใช้",
    icon: Users,
    roles: ["admin"],
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
}

export function Sidebar({
  role = "customer",
  userEmail,
  userName,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  const roleLabel = {
    customer: "ลูกค้า",
    staff: "พนักงาน",
    admin: "ผู้ดูแลระบบ",
  }[role];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg">
          <Bike className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <p className="font-semibold text-white text-sm truncate">
              ป่าโยว์เย่
            </p>
            <p className="text-[11px] text-sidebar-foreground/60 truncate">
              ระบบจัดการร้านซ่อม
            </p>
          </div>
        )}
        <button
          className="ml-auto p-1.5 rounded-md text-sidebar-foreground/60 hover:text-white hover:bg-white/10 transition-colors hidden lg:flex"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "ขยาย sidebar" : "ย่อ sidebar"}
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* User info */}
      <div
        className={cn(
          "px-4 py-4 border-b border-white/10",
          collapsed && "px-2",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center",
          )}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-foreground">
              {userName?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {userName ?? "ผู้ใช้งาน"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {roleLabel}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative",
                "min-h-[44px]",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-white",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className={cn("p-3 border-t border-white/10", collapsed && "px-2")}>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg",
            "text-sidebar-foreground/60 hover:text-white hover:bg-destructive/20 transition-colors",
            "min-h-[44px]",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">ออกจากระบบ</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-white shadow-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="เปิด/ปิดเมนู"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-40 w-72 bg-sidebar transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30",
          "bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

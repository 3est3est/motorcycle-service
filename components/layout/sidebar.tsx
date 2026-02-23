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
    href: "/users",
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

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-sidebar text-white shadow-xl min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-sidebar/90 transition-all border border-white/10"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="เปิด/ปิดเมนู"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-sidebar transition-transform duration-500 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent
          role={role}
          userName={userName}
          roleLabel={roleLabel}
          collapsed={false}
          filteredItems={filteredItems}
          pathname={pathname}
          onItemClick={() => setMobileOpen(false)}
        />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30",
          "bg-sidebar transition-all duration-300 border-r border-sidebar-border/50",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <SidebarContent
          role={role}
          userName={userName}
          roleLabel={roleLabel}
          collapsed={collapsed}
          filteredItems={filteredItems}
          pathname={pathname}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  userName,
  roleLabel,
  collapsed,
  filteredItems,
  pathname,
  onItemClick,
  onToggleCollapse,
}: any) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    // Safety timeout: forced redirect if API takes too long
    const timeoutId = setTimeout(() => {
      window.location.replace("/login");
    }, 3000);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      clearTimeout(timeoutId);

      // Delay slightly for session processing
      await new Promise((resolve) => setTimeout(resolve, 800));
      window.location.replace("/login");
    } catch (err) {
      window.location.replace("/login");
    }
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border/50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border/50">
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/10">
          <Bike className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="font-black text-sidebar-foreground text-base tracking-tight leading-none mb-1">
              ป่าโยว์เย่
            </p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-sidebar-muted">
              Repair Management
            </p>
          </div>
        )}
        {onToggleCollapse && (
          <button
            className="p-2 rounded-xl text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-foreground/5 transition-all hidden lg:flex"
            onClick={onToggleCollapse}
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform duration-500",
                collapsed && "rotate-180",
              )}
            />
          </button>
        )}
      </div>

      {/* User Profiles */}
      <div className={cn("px-4 py-6", collapsed && "px-2")}>
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-2xl bg-sidebar-foreground/5 border border-sidebar-border/50",
            collapsed && "justify-center p-1 bg-transparent border-none",
          )}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-linear-to-tr from-primary/40 to-primary/10 flex items-center justify-center ring-1 ring-sidebar-border/20 overflow-hidden">
            <span className="text-sm font-black text-sidebar-foreground">
              {userName?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-sidebar-foreground truncate">
                {userName ?? "ผู้ใช้งาน"}
              </p>
              <p className="text-[10px] font-bold text-sidebar-muted uppercase tracking-tighter">
                {roleLabel}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nav Link List */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
        <ul className="menu menu-md gap-1 p-0">
          {filteredItems.map((item: any) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20 font-bold"
                      : "text-sidebar-muted hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground",
                    collapsed && "justify-center px-0 h-10 w-10 mx-auto",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 transition-transform",
                      isActive && "stroke-[2.5]",
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm tracking-tight">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Action Footer */}
      <div
        className={cn(
          "p-4 border-t border-sidebar-border/50",
          collapsed && "p-2",
        )}
      >
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "btn btn-ghost w-full justify-start gap-4 rounded-2xl normal-case hover:bg-rose-500/10 hover:text-rose-500 transition-all group",
            collapsed &&
              "btn-square p-0 h-10 w-10 min-h-0 mx-auto justify-center",
            isLoggingOut && "loading",
          )}
        >
          {!isLoggingOut && (
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
          )}
          {!collapsed && (
            <span className="text-sm font-bold tracking-tight">
              {isLoggingOut ? "กำลังออก..." : "ออกจากระบบ"}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

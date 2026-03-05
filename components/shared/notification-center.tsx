"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  Info,
  AlertTriangle,
  AlertCircle,
  ShoppingBag,
  Calendar,
  Wrench,
  CreditCard,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const NOTIFICATION_ICONS: Record<string, any> = {
  INFO: Info,
  SUCCESS: Check,
  WARNING: AlertTriangle,
  ERROR: AlertCircle,
  BOOKING_NEW: Calendar,
  REPAIR_STATUS: Wrench,
  STOCK_LOW: ShoppingBag,
  PAYMENT_CONFIRMED: CreditCard,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  INFO: "text-blue-500",
  SUCCESS: "text-emerald-500",
  WARNING: "text-amber-500",
  ERROR: "text-rose-500",
  BOOKING_NEW: "text-indigo-500",
  REPAIR_STATUS: "text-sky-500",
  STOCK_LOW: "text-rose-500",
  PAYMENT_CONFIRMED: "text-emerald-500",
};

export function NotificationCenter({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      return res.json();
    },
    enabled: !!userId,
  });

  const markRead = useMutation({
    mutationFn: async ({ id, all }: { id?: string; all?: boolean }) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { all }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 flex items-center justify-center rounded-lg hover:bg-muted active-prime"
        >
          <Bell
            className={cn(
              "w-5 h-5 text-muted-foreground",
              unreadCount > 0 && "text-primary",
            )}
          />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse border-2 border-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 overflow-hidden rounded-xl border shadow-lg bg-card translate-y-2"
      >
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm">การแจ้งเตือน</h3>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="px-1.5 py-0 text-[10px] h-4 min-w-4 justify-center"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="link"
              className="h-auto p-0 text-[11px] font-bold text-primary"
              onClick={() => markRead.mutate({ all: true })}
            >
              ทำเป็นอ่านแล้วทั้งหมด
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-10 text-center space-y-3 opacity-40">
              <Bell
                className="w-10 h-10 mx-auto text-muted-foreground"
                strokeWidth={1}
              />
              <p className="text-xs font-medium">ยังไม่มีการแจ้งเตือน</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n: any) => {
                const Icon = NOTIFICATION_ICONS[n.type] || Bell;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "p-4 flex gap-4 transition-all hover:bg-muted/50 cursor-pointer active:bg-muted",
                      !n.read && "bg-primary/5",
                    )}
                    onClick={() => {
                      if (!n.read) markRead.mutate({ id: n.id });
                    }}
                  >
                    <div
                      className={cn(
                        "mt-0.5 p-2 rounded-lg bg-background border flex items-center justify-center shrink-0 h-10 w-10",
                        NOTIFICATION_COLORS[n.type],
                      )}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "text-xs leading-tight transition-all truncate",
                            !n.read
                              ? "font-bold text-primary"
                              : "font-medium text-muted-foreground",
                          )}
                        >
                          {n.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                          {formatDistanceToNow(new Date(n.created_at), {
                            addSuffix: true,
                            locale: th,
                          })}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-[11px] leading-relaxed transition-all",
                          !n.read
                            ? "text-foreground font-medium"
                            : "text-muted-foreground",
                        )}
                      >
                        {n.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <Button
          variant="ghost"
          className="w-full h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted/50 rounded-none"
        >
          ดูประวัติทั้งหมด
        </Button>
      </PopoverContent>
    </Popover>
  );
}

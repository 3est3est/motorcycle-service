"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface RealtimeContextType {
  status: "INITIAL" | "SUBSCRIBED" | "ERROR";
  onlineUsers: Set<string>;
}

const RealtimeContext = createContext<RealtimeContextType>({
  status: "INITIAL",
  onlineUsers: new Set(),
});

export function RealtimeProvider({
  children,
  userId,
  userRole,
  customerId,
}: {
  children: React.ReactNode;
  userId: string;
  userRole: string;
  customerId?: string;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"INITIAL" | "SUBSCRIBED" | "ERROR">("INITIAL");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    // 1. Presence / Online Status
    const presenceChannel = supabase.channel("online-status", {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const activeIds = new Set<string>();
        Object.keys(state).forEach((key) => activeIds.add(key));
        setOnlineUsers(activeIds);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    // 2. Notifications (Specific to User)
    const notificationSub = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          queryClient.invalidateQueries({
            queryKey: ["notifications", userId],
          });
        },
      )
      .subscribe();

    // 3. Bookings (Staff/Admin: All, Customer: Own)
    const bookingSub = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          ...(userRole === "customer" && customerId ? { filter: `customer_id=eq.${customerId}` } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
        },
      )
      .subscribe();

    // 4. Repair Jobs
    const repairSub = supabase
      .channel("repairs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "repair_jobs",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["repairs"] });
          queryClient.invalidateQueries({ queryKey: ["repair-job"] });
          queryClient.invalidateQueries({ queryKey: ["customer-repairs"] });
          queryClient.invalidateQueries({ queryKey: ["repair-status"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
        },
      )
      .subscribe();

    // 5. Payments
    const paymentSub = supabase
      .channel("payments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["payments"] });
          queryClient.invalidateQueries({ queryKey: ["payment-for-job"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
        },
      )
      .subscribe();

    // 6. Parts / Inventory
    const partsSub = supabase
      .channel("parts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parts",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["parts"] });
          queryClient.invalidateQueries({ queryKey: ["inventory"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
        },
      )
      .subscribe();

    // 6.1 Inventory Logs
    const logsSub = supabase
      .channel("inventory-logs-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "part_inventory_logs",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["inventory-logs"] });
        },
      )
      .subscribe();

    // 7. Repair Parts (Used in jobs)
    const repairPartsSub = supabase
      .channel("repair-parts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "repair_parts",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["repair-parts"] });
          queryClient.invalidateQueries({ queryKey: ["repair-job"] });
        },
      )
      .subscribe();

    // 8. Quotations
    const quotationSub = supabase
      .channel("quotations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quotations",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["quotations"] });
          queryClient.invalidateQueries({
            queryKey: ["quotation-for-booking"],
          });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        },
      )
      .subscribe();

    // 8.1 Estimates
    const estimateSub = supabase
      .channel("estimates-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "estimates",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["estimates"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["customer-repairs"] });
        },
      )
      .subscribe();

    // 9. Motorcycles (Customer: Own, Staff: All)
    const motorcycleSub = supabase
      .channel("motorcycles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "motorcycles",
          ...(userRole === "customer" && customerId ? { filter: `customer_id=eq.${customerId}` } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["motorcycles"] });
        },
      )
      .subscribe();

    // 10. Loyalty Points / Transactions
    const loyaltySub = supabase
      .channel("loyalty-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loyalty_points",
          ...(userRole === "customer" && customerId ? { filter: `customer_id=eq.${customerId}` } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["loyalty-points"] });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          queryClient.invalidateQueries({ queryKey: ["users"] });
        },
      )
      .subscribe();

    // 11. Users (Admin only)
    let usersSub: any = null;
    if (userRole === "admin" || userRole === "staff") {
      usersSub = supabase
        .channel("users-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "users",
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["staff-users"] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
          },
        )
        .subscribe();
    }

    setStatus("SUBSCRIBED");

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(notificationSub);
      supabase.removeChannel(bookingSub);
      supabase.removeChannel(repairSub);
      supabase.removeChannel(paymentSub);
      supabase.removeChannel(partsSub);
      supabase.removeChannel(logsSub);
      supabase.removeChannel(repairPartsSub);
      supabase.removeChannel(quotationSub);
      supabase.removeChannel(estimateSub);
      supabase.removeChannel(motorcycleSub);
      supabase.removeChannel(loyaltySub);
      if (usersSub) supabase.removeChannel(usersSub);
    };
  }, [userId, userRole, customerId, queryClient]);

  return <RealtimeContext.Provider value={{ status, onlineUsers }}>{children}</RealtimeContext.Provider>;
}

export const useRealtime = () => useContext(RealtimeContext);

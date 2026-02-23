import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Not authenticated — middleware should handle this,
  // but fallback redirect just in case
  if (!authUser) {
    redirect("/login");
  }

  // Get role and display name from DB
  let role: UserRole = "customer";
  let userName = authUser.email ?? "ผู้ใช้งาน";
  let userEmail = authUser.email ?? "";

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { customer: true },
    });

    if (dbUser) {
      role = dbUser.role as UserRole;
      if (dbUser.customer?.full_name) {
        userName = dbUser.customer.full_name;
      }
      userEmail = dbUser.email;
    } else {
      // Fallback to metadata if DB not yet synced
      const meta = authUser.user_metadata;
      role = (meta?.role as UserRole) ?? "customer";
      userName = meta?.full_name ?? authUser.email ?? "ผู้ใช้งาน";
    }
  } catch {
    // DB might not have the user yet — use auth metadata
    const meta = authUser.user_metadata;
    role = (meta?.role as UserRole) ?? "customer";
    userName = meta?.full_name ?? authUser.email ?? "ผู้ใช้งาน";
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={role} userName={userName} userEmail={userEmail} />
      <main className={cn("transition-all duration-300", "lg:pl-64")}>
        {children}
      </main>
    </div>
  );
}

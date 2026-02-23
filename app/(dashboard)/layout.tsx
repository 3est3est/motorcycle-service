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

  // Get role and display name from DB or metadata
  let role: UserRole = "customer";
  let userName =
    authUser.user_metadata?.full_name ?? authUser.email ?? "ผู้ใช้งาน";
  let userEmail = authUser.email ?? "";

  try {
    const meta = authUser.user_metadata;

    // Use upsert to prevent race conditions and ensure user data is synced
    const dbUser = await prisma.user.upsert({
      where: { id: authUser.id },
      update: {
        email: authUser.email!,
        role: (meta?.role as UserRole) ?? "customer",
        customer: {
          upsert: {
            create: {
              full_name:
                meta?.full_name ?? authUser.email?.split("@")[0] ?? "ผู้ใช้งาน",
              phone: meta?.phone ?? "",
            },
            update: {
              full_name:
                meta?.full_name ?? authUser.email?.split("@")[0] ?? "ผู้ใช้งาน",
              phone: meta?.phone ?? "",
            },
          },
        },
      },
      create: {
        id: authUser.id,
        email: authUser.email!,
        role: (meta?.role as UserRole) ?? "customer",
        customer: {
          create: {
            full_name:
              meta?.full_name ?? authUser.email?.split("@")[0] ?? "ผู้ใช้งาน",
            phone: meta?.phone ?? "",
          },
        },
      },
      include: { customer: true },
    });

    // Update local variables from DB
    role = dbUser.role as UserRole;
    if (dbUser.customer?.full_name) {
      userName = dbUser.customer.full_name;
    }
    userEmail = dbUser.email;
  } catch (error) {
    console.error("Dashboard layout sync error:", error);
    // Fallback to metadata if DB fails completely
    role = (authUser.user_metadata?.role as UserRole) ?? "customer";
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

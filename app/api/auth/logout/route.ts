import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();

  // 1. Initialize Supabase client
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

  // 2. Call Supabase SignOut
  await supabase.auth.signOut();

  // 3. Create response and aggressively clear all cookies
  const response = NextResponse.json({
    success: true,
    message: "ออกจากระบบสำเร็จ",
  });

  // Get all session related cookies
  const allCookies = cookieStore.getAll();

  // Clear every single cookie that looks like a supabase or session cookie
  for (const cookie of allCookies) {
    // Delete for "/" path (most common)
    response.cookies.set(cookie.name, "", {
      path: "/",
      expires: new Date(0),
      maxAge: -1,
    });

    // Also try to delete without path (sometimes browser sets it differently)
    response.cookies.delete(cookie.name);
  }

  // Force delete the standard ones explicitly
  const commonCookies = [
    "supabase-auth-token",
    "sb-access-token",
    "sb-refresh-token",
    "theme", // Optional: Keep theme if you want, but for full reset we can clear it too (actually let's keep theme)
  ];

  commonCookies.forEach((name) => {
    if (name !== "theme") {
      response.cookies.set(name, "", {
        path: "/",
        expires: new Date(0),
        maxAge: -1,
      });
    }
  });

  // Prevent any caching
  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

  return response;
}

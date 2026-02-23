import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );

  // 2. Call Supabase SignOut with safety
  try {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Supabase signOut error detail:", error);
  } catch (err) {
    console.error("Supabase signOut exception:", err);
  }

  // 3. Create response and aggressively clear all cookies
  // Determine site root for cookie path
  const url = new URL(request.url);
  const redirectUrl = new URL("/login", url.origin);

  const response = NextResponse.json(
    { success: true, message: "ออกจากระบบสำเร็จ" },
    { status: 200 },
  );

  // Get all session related cookies
  const allCookies = cookieStore.getAll();
  const supabaseProjectRef =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.split(".")[0].split("//")[1];

  // Clear every single cookie that looks like a supabase or session cookie
  for (const cookie of allCookies) {
    if (cookie.name === "theme") continue;

    // Delete definitively
    response.cookies.set(cookie.name, "", {
      path: "/",
      domain: url.hostname,
      expires: new Date(0),
      maxAge: -1,
      secure: true,
      sameSite: "lax",
    });

    // Fallback delete
    response.cookies.delete(cookie.name);
  }

  // Explicitly clear standard Supabase patterns
  const patterns = [
    "supabase-auth-token",
    "sb-access-token",
    "sb-refresh-token",
    "sb-auth-token",
    `sb-${supabaseProjectRef}-auth-token`,
  ];

  patterns.forEach((name) => {
    response.cookies.set(name, "", {
      path: "/",
      expires: new Date(0),
      maxAge: -1,
    });
    response.cookies.delete(name);
  });

  // Prevent any caching of this response
  response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}

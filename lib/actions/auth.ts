"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {
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
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch (error) {
            // Ignore if setting in server component
          }
        },
      },
    },
  );

  // 1. Supabase SignOut
  await supabase.auth.signOut();

  // 2. Aggressively clear session cookies
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name === "theme") continue;

    cookieStore.set(cookie.name, "", {
      path: "/",
      expires: new Date(0),
      maxAge: -1,
    });
    cookieStore.delete(cookie.name);
  }

  // 3. Clear explicit patterns
  const patterns = [
    "supabase-auth-token",
    "sb-access-token",
    "sb-refresh-token",
    "sb-auth-token",
  ];
  patterns.forEach((name) => {
    cookieStore.delete(name);
    cookieStore.set(name, "", { path: "/", expires: new Date(0), maxAge: -1 });
  });

  // 4. Redirect to login
  redirect("/login");
}

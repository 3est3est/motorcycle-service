import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const isDark = cookieStore.get("theme")?.value === "dark";
  const newTheme = isDark ? "light" : "dark";

  const response = NextResponse.json({ success: true, theme: newTheme });
  response.cookies.set("theme", newTheme, { path: "/" });

  return response;
}

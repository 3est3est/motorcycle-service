import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role || "customer";
  const path = request.nextUrl.pathname;

  // Public paths that don't require auth
  const publicPaths = ["/", "/login", "/register"];
  const isPublicPath = publicPaths.some((p) => path === p || path.startsWith("/api/auth"));

  // 1. ถ้าไม่ได้ Login และเข้าหน้าอื่นที่ไม่ใช่หน้า Login/Register -> ไปหน้า Login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. ถ้า Login แล้ว และพยายามเข้าหน้า Login/Register -> ไป Dashboard
  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 3. ป้องกันเส้นทางตามสิทธิ (Role Protection)
  const isShopManagement = ["/admin", "/parts", "/repair-jobs", "/users", "/api/staff", "/api/parts", "/api/admin"].some((p) =>
    path.startsWith(p),
  );

  // Admin/Staff only: จัดการผู้ใช้, ดู report รวม หรือจัดการระบบเชิงลึก (ที่ต้องการสิทธิ Admin/Staff เท่านั้น)
  const isShopManagementZone = ["/users", "/api/admin"].some((p) => path.startsWith(p));

  if (user) {
    // ลูกค้าห้ามเข้าโซนคนของร้าน (ยกเว้น /estimates, /quotations, /api/estimates, /api/quotations, /api/bookings)
    const customerBlockedPaths = ["/admin", "/parts", "/repair-jobs", "/users", "/api/staff", "/api/parts", "/api/admin"];
    const isBlockedForCustomer = customerBlockedPaths.some((p) => path.startsWith(p));

    if (role === "customer" && (isBlockedForCustomer || isShopManagementZone)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // พนักงานห้ามเข้าโซนพรีเมียมแอดมิน (จัดการระบบลึกๆ ผ่าน API)
    const isAdminOnlyAPI = path.startsWith("/api/admin");
    if (role === "staff" && isAdminOnlyAPI) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

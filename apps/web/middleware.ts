import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PARENT_ROUTES  = ["/dashboard", "/children", "/billing"];
const PROTECTED_STUDENT_ROUTES = ["/home", "/learn", "/exam", "/results"];
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not remove — refreshes the session and keeps cookies in sync
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const isParentRoute  = PROTECTED_PARENT_ROUTES.some((r) => path.startsWith(r));
  const isStudentRoute = PROTECTED_STUDENT_ROUTES.some((r) => path.startsWith(r));
  const isAuthRoute    = AUTH_ROUTES.some((r) => path.startsWith(r));

  // Unauthenticated → redirect to login
  if (!user && (isParentRoute || isStudentRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Authenticated hitting auth routes → redirect to their home
  if (user && isAuthRoute) {
    const role = (user.app_metadata?.["role"] as string) ?? "parent";
    const url = request.nextUrl.clone();
    url.pathname = role === "student" ? "/home" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Role mismatch: student hitting parent route
  if (user && isParentRoute) {
    const role = (user.app_metadata?.["role"] as string) ?? "parent";
    if (role === "student") {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
  }

  // Role mismatch: parent hitting student route
  if (user && isStudentRoute) {
    const role = (user.app_metadata?.["role"] as string) ?? "parent";
    if (role !== "student") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

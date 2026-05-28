import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/guest-pay", "/search"];
const AUTH_ROUTES   = ["/login", "/signup", "/unauthorized"];
const PUBLIC_API    = ["/api/properties/search", "/api/properties?"];

function isPublic(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) ||
    AUTH_ROUTES.some((r)   => pathname.startsWith(r)) ||
    PUBLIC_API.some((r)    => pathname.startsWith(r)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  );
}

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          res = NextResponse.next({ request: { headers: req.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always call getUser() — this refreshes the session cookie so API
  // routes receive a valid token when they call getUser() themselves.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return res;

  if (!user) {
    // API routes: return 401 instead of redirecting
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = user.user_metadata?.role as string | undefined;

  if (pathname.startsWith("/landlord") && role !== "landlord") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (pathname.startsWith("/tenant") && role !== "tenant") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
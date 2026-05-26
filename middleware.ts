import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require no authentication
const PUBLIC_ROUTES = ["/guest-pay", "/search"];

// Routes open to unauthenticated users (auth pages, static, etc.)
const AUTH_ROUTES = ["/login", "/signup", "/unauthorized"];

function isPublic(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) ||
    AUTH_ROUTES.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  );
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session — keeps cookie up to date
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Always allow public routes
  if (isPublic(pathname)) return res;

  // No session → redirect to login
  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Extract role from JWT user_metadata
  const role = session.user.user_metadata?.role as string | undefined;

  // /landlord/* — landlords only
  if (pathname.startsWith("/landlord") && role !== "landlord") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // /tenant/* — tenants only
  if (pathname.startsWith("/tenant") && role !== "tenant") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static files.
     * Adjust if you have additional static asset paths.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
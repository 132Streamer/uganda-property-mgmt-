import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware'

// ---------------------------------------------------------------------------
// Route config
// ---------------------------------------------------------------------------

const PUBLIC_ROUTES = ['/search', '/guest']
const AUTH_ROUTES   = ['/login', '/signup']

const ROLE_ROUTES: Record<string, string> = {
  '/landlord': 'landlord',
  '/tenant':   'tenant',
}

// Role → where to land after login
const ROLE_DASHBOARDS: Record<string, string> = {
  landlord: '/landlord/dashboard',
  tenant:   '/tenant/portal',
}

const UNAUTHORIZED_URL = '/unauthorized'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function getRequiredRole(pathname: string): string | null {
  for (const [prefix, role] of Object.entries(ROLE_ROUTES)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return role
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabase, supabaseResponse } = createSupabaseMiddlewareClient(request)

  // IMPORTANT: always call getUser() to refresh the session cookie.
  // Never use getSession() in middleware — it trusts the client cookie alone.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ------------------------------------------------------------------
  // 1. Public routes — always allow
  // ------------------------------------------------------------------
  if (matchesPrefix(pathname, PUBLIC_ROUTES)) {
    return supabaseResponse
  }

  // ------------------------------------------------------------------
  // 2. Auth routes (/login, /signup) — redirect logged-in users
  // ------------------------------------------------------------------
  if (matchesPrefix(pathname, AUTH_ROUTES)) {
    if (!user) return supabaseResponse

    // Fetch role so we can redirect to the correct dashboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const dashboard =
      (profile?.role && ROLE_DASHBOARDS[profile.role as string]) ??
      ROLE_DASHBOARDS['tenant'] // fallback

    return NextResponse.redirect(new URL(dashboard, request.url))
  }

  // ------------------------------------------------------------------
  // 3. Protected role routes (/landlord/*, /tenant/*)
  // ------------------------------------------------------------------
  const requiredRole = getRequiredRole(pathname)

  if (requiredRole) {
    // Not authenticated → send to login with return URL
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Fetch role from profiles table (single source of truth)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error || !profile) {
      // Profile missing — treat as unauthorised
      return NextResponse.redirect(new URL(UNAUTHORIZED_URL, request.url))
    }

    if (profile.role !== requiredRole) {
      return NextResponse.redirect(new URL(UNAUTHORIZED_URL, request.url))
    }

    // Correct role — allow through, pass refreshed cookies
    return supabaseResponse
  }

  // ------------------------------------------------------------------
  // 4. All other routes — require authentication only
  // ------------------------------------------------------------------
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

// ---------------------------------------------------------------------------
// Matcher — runs on every non-static, non-Next-internal request
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - _next/static  (static assets)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - public folder assets (svg, png, jpg, jpeg, gif, webp, ico, txt)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)',
  ],
}
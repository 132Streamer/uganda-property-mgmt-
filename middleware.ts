import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes — always allow
  if (pathname === '/' || pathname === '/search' || pathname.startsWith('/search/')) {
    return supabaseResponse
  }

  // Auth routes — redirect to dashboard if already logged in
  if (pathname === '/login' || pathname === '/signup') {
    if (user) {
      const role = await getUserRole(supabase, user.id)
      const dashboard = role === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard'
      return NextResponse.redirect(new URL(dashboard, request.url))
    }
    return supabaseResponse
  }

  // All other routes require authentication
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-protected routes
  if (pathname.startsWith('/landlord/') || pathname.startsWith('/tenant/')) {
    const role = await getUserRole(supabase, user.id)

    if (!role) {
      // Profile missing — kick to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (pathname.startsWith('/landlord/') && role !== 'landlord') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    if (pathname.startsWith('/tenant/') && role !== 'tenant') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return supabaseResponse
}

async function getUserRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data.role
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
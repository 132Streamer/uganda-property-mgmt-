import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/search', '/login', '/signup']

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  // /pay/[token]
  if (pathname.startsWith('/pay/')) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required for Server Components to read updated tokens
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublic = isPublicPath(pathname)

  // No session — guard protected routes
  if (!user) {
    if (!isPublic) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  const role = user.user_metadata?.role as 'landlord' | 'tenant' | undefined

  // Landlord hitting a tenant-only path
  if (role === 'landlord' && pathname.startsWith('/tenant')) {
    const url = request.nextUrl.clone()
    url.pathname = '/landlord/dashboard'
    return NextResponse.redirect(url)
  }

  // Tenant hitting a landlord-only path
  if (role === 'tenant' && pathname.startsWith('/landlord')) {
    const url = request.nextUrl.clone()
    url.pathname = '/tenant/portal'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - public assets (png, jpg, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/search', '/signup', '/', '/login/callback', '/landlord/dashboard', '/tenant/portal']
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  try {
    // Get the session from cookies
    const authToken = request.cookies.get('sb-access-token')?.value

    if (!authToken) {
      // No token, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check role-based routes
    if (pathname.startsWith('/landlord')) {
      // Landlord-only route
      // In production, you would verify the user role matches 'landlord'
      // const role = await getUserRole(authToken)
      // if (role !== 'landlord') return NextResponse.redirect(new URL('/tenant/portal', request.url))
    }

    if (pathname.startsWith('/tenant')) {
      // Tenant-only route
      // In production, you would verify the user role matches 'tenant'
      // const role = await getUserRole(authToken)
      // if (role !== 'tenant') return NextResponse.redirect(new URL('/landlord/dashboard', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    // On error, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}



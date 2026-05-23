import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for demo routes and role-based routes
  if (pathname.startsWith('/landlord') || pathname.startsWith('/tenant') || pathname.startsWith('/test')) {
    return NextResponse.next()
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/search', '/signup', '/', '/login/callback']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  try {
    // Get the session from cookies
    const authToken = request.cookies.get('sb-access-token')?.value

    if (!authToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}



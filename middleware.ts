import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/search', '/signup', '/']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Create a Supabase client
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false,
    },
  })

  try {
    // Get the session from cookies
    const authToken = request.cookies.get('sb-access-token')?.value

    if (!authToken) {
      // No token, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verify the token by checking the auth state
    // For role-based routing, we'd typically verify here
    // This is a simplified example

    // Check role-based routes
    if (pathname.startsWith('/landlord') || pathname.startsWith('/(landlord)')) {
      // Landlord-only route
      // You would verify role here in production
    }

    if (pathname.startsWith('/tenant') || pathname.startsWith('/(tenant)')) {
      // Tenant-only route
      // You would verify role here in production
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

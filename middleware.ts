import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: any; value: any; options: any; }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated — redirect to login
  if (!user) {
    const isProtected =
      pathname.startsWith("/landlord") || pathname.startsWith("/tenant");
    if (isProtected) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const role = user.user_metadata?.role as string | undefined;

  // Landlord routes — tenant blocked
  if (pathname.startsWith("/landlord") && role !== "landlord") {
    return NextResponse.redirect(new URL("/tenant/portal", request.url));
  }

  // Tenant routes — landlord blocked
  if (pathname.startsWith("/tenant") && role !== "tenant") {
    return NextResponse.redirect(new URL("/landlord/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/landlord/:path*", "/tenant/:path*"],
};
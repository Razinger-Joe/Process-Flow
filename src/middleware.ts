import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that are public (do not require login)
  const isPublicPath = pathname === '/login' || pathname === '/register';

  // Read auth token from cookie
  const token = request.cookies.get('auth_token')?.value;

  // 1. If trying to access protected path and has no token, redirect to /login
  // BYPASS: Auth removed for now
  // if (!isPublicPath && !token) {
  //   const loginUrl = new URL('/login', request.url);
  //   loginUrl.searchParams.set('redirect', pathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  // 2. If trying to access /login or /register and already has token, redirect to dashboard /
  // BYPASS: Auth removed for now
  // if (isPublicPath && token) {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }

  return NextResponse.next();
}

// Config to specify which paths this middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

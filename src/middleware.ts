import { NextResponse, type NextRequest } from 'next/server';

// NOTE: This is a UX-only redirect guard, not a security boundary.
// It checks for the presence of the Supabase auth cookie but does NOT validate
// the JWT inside it. Expired or invalid tokens still pass this check.
// All actual auth enforcement happens per-request via supabase.auth.getSession()
// inside each page/component.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/', '/login', '/register', '/reset-password', '/privacy', '/terms', '/contact'];
  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
  const isAuthCallback = pathname.startsWith('/auth/callback');
  const isAsset = pathname.startsWith('/_next') || pathname.includes('.');

  if (isPublic || isAuthCallback || isAsset) {
    return NextResponse.next();
  }

  const hasAuthCookie = request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  if (!hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

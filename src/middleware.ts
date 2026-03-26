import { NextResponse, type NextRequest } from 'next/server';

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

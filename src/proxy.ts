import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/home', '/citas', '/chat', '/perfil', '/explorar', '/estudiante', '/reservar', '/confirmacion', '/dashboard', '/quiz'];
const PUBLIC_ONLY = ['/login', '/signup', '/welcome'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('authToken')?.value;

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isPublicOnly = PUBLIC_ONLY.some(p => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/welcome', request.url));
  }

  if (isPublicOnly && token) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};

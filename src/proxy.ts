import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/home', '/citas', '/chat', '/perfil', '/explorar', '/estudiante', '/reservar', '/confirmacion', '/dashboard', '/quiz', '/funnel-qa'];
const PUBLIC_ONLY = ['/login', '/signup', '/welcome'];
const INTERNAL_TOOLS = ['/funnel-qa'];

function internalToolsEnabled() {
  return process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_FUNNEL_QA === 'true';
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('authToken')?.value;
  const role = request.cookies.get('authRole')?.value;
  const isStudent = role === 'student' || role === 'admin';

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isPublicOnly = PUBLIC_ONLY.some(p => pathname.startsWith(p));
  const isInternalTool = INTERNAL_TOOLS.some(p => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/welcome', request.url));
  }

  if (isPublicOnly && token) {
    return NextResponse.redirect(new URL(isStudent ? '/dashboard' : '/home', request.url));
  }

  if (token && isInternalTool && role !== 'admin' && !internalToolsEnabled()) {
    return NextResponse.redirect(new URL(isStudent ? '/dashboard' : '/home', request.url));
  }

  if (token && pathname.startsWith('/dashboard') && !isStudent) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  if (token && pathname.startsWith('/home') && isStudent) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};

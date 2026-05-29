import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRoleHome, normalizeAuthRole } from '@/lib/auth-routing';

const PROTECTED = ['/home', '/citas', '/chat', '/perfil', '/explorar', '/estudiante', '/confirmacion', '/dashboard', '/quiz', '/funnel-qa', '/telemetry-qa'];
const PUBLIC_ONLY = ['/login', '/signup', '/welcome'];
const INTERNAL_TOOLS = ['/funnel-qa', '/telemetry-qa'];

function internalToolsEnabled() {
  return process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_FUNNEL_QA === 'true';
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('authToken')?.value;
  const role = normalizeAuthRole(request.cookies.get('authRole')?.value);
  const roleHome = getRoleHome(role);
  const isStudent = roleHome === '/dashboard';

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isPublicOnly = PUBLIC_ONLY.some(p => pathname.startsWith(p));
  const isInternalTool = INTERNAL_TOOLS.some(p => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/welcome', request.url));
  }

  if (isPublicOnly && token) {
    return NextResponse.redirect(new URL(roleHome, request.url));
  }

  if (token && isInternalTool && role !== 'admin' && !internalToolsEnabled()) {
    return NextResponse.redirect(new URL(roleHome, request.url));
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

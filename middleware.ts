import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow static and API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // Special handling for Parents HQ access
  if (pathname.startsWith('/parents/hq')) {
    const pendingInviteCookie = req.cookies.get('pending_invite');
    const hasApprovalToken = req.nextUrl.searchParams.get('approvalToken');
    if (pendingInviteCookie || hasApprovalToken) {
      console.log('[MIDDLEWARE] Allowing PHQ access with invite or approvalToken');
      return NextResponse.next();
    }
  }

  // Canonical host redirect (production only): www -> apex
  try {
    const host = req.headers.get('host') || '';
    const isPreview = host.endsWith('.vercel.app');
    if (process.env.NODE_ENV === 'production' && !isPreview && host === 'www.cliqstr.com') {
      const url = req.nextUrl.clone();
      url.host = 'cliqstr.com';
      url.protocol = 'https';
      return NextResponse.redirect(url, 308);
    }
  } catch {}

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';

export async function middleware(req: NextRequest) {
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

  // 🚫 CRITICAL: Plan validation for My Cliqs Dashboard
  if (pathname === '/my-cliqs-dashboard') {
    try {
      const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionOptions);
      
      if (!session.userId) {
        console.log('[MIDDLEWARE] No session for dashboard access, redirecting to sign-in');
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }

      // We can't easily check the plan here without a database call,
      // so we'll let the page-level enforcement handle it
      // This is just a basic session check
      console.log('[MIDDLEWARE] Session found for dashboard access');
    } catch (error) {
      console.error('[MIDDLEWARE] Error checking session:', error);
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
  }

  // Allow magic link authentication routes
  if (pathname.startsWith('/auth/magic')) {
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

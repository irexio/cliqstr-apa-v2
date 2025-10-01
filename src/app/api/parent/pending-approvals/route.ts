import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionOptions);

    if (!session.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get current user to verify they're a parent
    const user = await convexHttp.query(api.users.getCurrentUser, {
      userId: session.userId as any,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'Parent' && user.role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied. Parent role required.' }, { status: 403 });
    }

    // Get pending approvals for this parent's email
    const pendingApprovals = await convexHttp.query(api.parentApprovals.getParentApprovalsByParentEmail, {
      parentEmail: user.email,
    });

    // Filter out expired approvals
    const now = Date.now();
    const validApprovals = pendingApprovals.filter(approval => approval.expiresAt > now);

    return NextResponse.json({ 
      pendingApprovals: validApprovals,
      count: validApprovals.length 
    });

  } catch (error: any) {
    console.error('[PENDING-APPROVALS] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch pending approvals',
      details: error.message 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { convexHttp } from '@/lib/convex-http';
import { api } from '@/convex/_generated/api';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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

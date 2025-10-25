import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const approvalId = searchParams.get('approvalId');

    if (!approvalId) {
      return NextResponse.json(
        { error: 'approval_id_required' },
        { status: 400 }
      );
    }

    // Check if user is logged in
    const session = await getIronSession<SessionData>(
      req,
      NextResponse.next(),
      sessionOptions
    );
    if (!session || !session.userId) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/parent-approval/resume?approvalId=${approvalId}`);
      return NextResponse.redirect(`/sign-in?returnTo=${returnUrl}`);
    }

    // Fetch the approval record
    const approval = await convexHttp.query(api.parentApprovals.getApprovalById, {
      approvalId: approvalId as any,
    });

    if (!approval) {
      return NextResponse.json(
        { error: 'approval_not_found' },
        { status: 404 }
      );
    }

    // Verify the approval belongs to the logged-in user by fetching their email from Convex
    const user = await convexHttp.query(api.users.getCurrentUser, {
      userId: session.userId as any,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'user_not_found' },
        { status: 404 }
      );
    }

    if (approval.parentEmail.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 403 }
      );
    }

    // Redirect to PHQ with approval data
    const queryParams = new URLSearchParams({
      approvalId: approvalId,
      token: approval.approvalToken,
      parentState: approval.parentState,
      resumed: 'true',
    });

    return NextResponse.redirect(`/parents/hq/child/new?${queryParams.toString()}`);
  } catch (error: any) {
    console.error('[RESUME_APPROVAL] Error:', error);
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500 }
    );
  }
}

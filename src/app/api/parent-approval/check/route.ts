import { NextResponse, NextRequest } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/parent-approval/check?token=ABC123
 * 
 * Checks if a parent approval token is valid and returns the pending signup data
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'No approval token provided' }, { status: 400 });
    }

    console.log(`[PARENT-APPROVAL-CHECK] Checking token: ${token}`);

    // Get the parent approval by token
    const pendingSignup = await convexHttp.query(api.parentApprovals.getParentApprovalByToken, {
      approvalToken: token,
    });

    if (!pendingSignup) {
      console.log(`[PARENT-APPROVAL-CHECK] Token not found or expired: ${token}`);
      return NextResponse.json({ error: 'Invalid or expired approval token' }, { status: 404 });
    }

    console.log(`[PARENT-APPROVAL-CHECK] Found pending signup for child: ${pendingSignup.childFirstName} ${pendingSignup.childLastName}`);

    return NextResponse.json({
      success: true,
      approval: {
        id: pendingSignup._id,
        childFirstName: pendingSignup.childFirstName,
        childLastName: pendingSignup.childLastName,
        childBirthdate: pendingSignup.childBirthdate,
        parentEmail: pendingSignup.parentEmail,
        status: pendingSignup.status,
        expiresAt: pendingSignup.expiresAt,
      },
    });

  } catch (error) {
    console.error('[PARENT-APPROVAL-CHECK] Error checking approval token:', error);
    return NextResponse.json({ 
      error: 'Failed to verify approval token' 
    }, { status: 500 });
  }
}

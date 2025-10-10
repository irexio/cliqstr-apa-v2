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
  console.log('[PARENT-APPROVAL-CHECK] Route called!');
  
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    console.log(`[PARENT-APPROVAL-CHECK] URL: ${req.url}`);
    console.log(`[PARENT-APPROVAL-CHECK] Token from URL: ${token}`);

    if (!token) {
      console.log('[PARENT-APPROVAL-CHECK] No token provided');
      return NextResponse.json({ error: 'No approval token provided' }, { status: 400 });
    }

    console.log(`[PARENT-APPROVAL-CHECK] Checking token: ${token}`);

    // Load the parent approval record from Convex
    const approval = await convexHttp.query(api.parentApprovals.getParentApprovalByToken, {
      approvalToken: token,
    });

    if (!approval) {
      console.log(`[PARENT-APPROVAL-CHECK] Token not found or expired: ${token}`);
      return NextResponse.json({
        error: 'Invalid or expired approval token',
      }, { status: 404 });
    }

    const now = Date.now();
    const isExpired = approval.expiresAt <= now;
    const isPending = approval.status === 'pending';

    console.log('[PARENT-APPROVAL-CHECK] Approval found:', {
      child: `${approval.childFirstName} ${approval.childLastName}`.trim(),
      context: approval.context,
      parentState: approval.parentState,
      status: approval.status,
      expiresAt: approval.expiresAt,
      isExpired,
    });

    return NextResponse.json({
      success: true,
      approval: {
        id: approval._id,
        approvalToken: approval.approvalToken,
        childFirstName: approval.childFirstName,
        childLastName: approval.childLastName,
        childBirthdate: approval.childBirthdate,
        parentEmail: approval.parentEmail,
        context: approval.context,
        inviteId: approval.inviteId ?? null,
        cliqId: approval.cliqId ?? null,
        inviterName: approval.inviterName ?? null,
        cliqName: approval.cliqName ?? null,
        parentState: approval.parentState,
        existingParentId: approval.existingParentId ?? null,
        status: approval.status,
        createdAt: approval.createdAt,
        approvedAt: approval.approvedAt ?? null,
        declinedAt: approval.declinedAt ?? null,
        expiresAt: approval.expiresAt,
        isExpired,
        isPending,
      },
    });

  } catch (error) {
    console.error('[PARENT-APPROVAL-CHECK] Error checking approval token:', error);
    return NextResponse.json({
      error: 'Failed to verify approval token'
    }, { status: 500 });
  }
}

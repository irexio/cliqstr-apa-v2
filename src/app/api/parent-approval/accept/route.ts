import { NextResponse, NextRequest } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const parentApprovalActionSchema = z.object({
  token: z.string().min(1, 'Approval token is required'),
  action: z.enum(['approve', 'decline']),
});

/**
 * POST /api/parent-approval/accept
 * 
 * Handles parent approval or decline actions
 * Supports both direct child signup and child invite scenarios
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = parentApprovalActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.errors[0]?.message || 'Invalid request data' 
      }, { status: 400 });
    }

    const { token, action } = parsed.data;

    console.log(`[PARENT-APPROVAL-ACCEPT] Processing ${action} for token: ${token}`);

    // Get the parent approval record
    const approval = await convexHttp.query(api.parentApprovals.getParentApprovalByToken, {
      approvalToken: token,
    });

    if (!approval) {
      return NextResponse.json({ 
        error: 'Invalid or expired approval token' 
      }, { status: 404 });
    }

    if (action === 'approve') {
      // Mark as approved
      await convexHttp.mutation(api.parentApprovals.approveParentApproval, {
        approvalToken: token,
      });

      console.log(`[PARENT-APPROVAL-ACCEPT] Approved parent approval for child: ${approval.childFirstName} ${approval.childLastName}`);

      // Determine redirect based on parent state
      let redirectUrl: string;
      
      console.log(`[PARENT-APPROVAL-ACCEPT] Parent state: ${approval.parentState}`);
      
      if (approval.parentState === 'existing_parent') {
        // Existing parent - go directly to Parents HQ (they already have a plan)
        console.log(`[PARENT-APPROVAL-ACCEPT] Redirecting existing parent to Parents HQ`);
        redirectUrl = `/parents/hq/dashboard?approvalToken=${encodeURIComponent(token)}`;
      } else {
        // New parent or existing adult converting to parent - go to sign-up first
        console.log(`[PARENT-APPROVAL-ACCEPT] Redirecting new/existing adult to sign-up`);
        redirectUrl = `/sign-up?email=${encodeURIComponent(approval.parentEmail)}&approvalToken=${encodeURIComponent(token)}`;
      }

      return NextResponse.json({
        success: true,
        message: 'Parent approval successful',
        redirectUrl,
        approval: {
          id: approval._id,
          childName: `${approval.childFirstName} ${approval.childLastName}`,
          context: approval.context,
          parentState: approval.parentState,
        },
      });

    } else if (action === 'decline') {
      // Mark as declined
      await convexHttp.mutation(api.parentApprovals.declineParentApproval, {
        approvalToken: token,
      });

      console.log(`[PARENT-APPROVAL-ACCEPT] Declined parent approval for child: ${approval.childFirstName} ${approval.childLastName}`);

      // TODO: If this was from an invite, notify the inviter
      // For now, just return success
      return NextResponse.json({
        success: true,
        message: 'Parent approval declined',
        redirectUrl: '/parent-approval-declined',
      });

    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "approve" or "decline"' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[PARENT-APPROVAL-ACCEPT] Error processing approval:', error);
    return NextResponse.json({ 
      error: 'Failed to process parent approval' 
    }, { status: 500 });
  }
}

/**
 * GET /api/parent-approval/accept?token=ABC123
 * 
 * Checks if a parent approval token is valid and returns the approval data
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
    const approval = await convexHttp.query(api.parentApprovals.getParentApprovalByToken, {
      approvalToken: token,
    });

    if (!approval) {
      console.log(`[PARENT-APPROVAL-CHECK] Token not found or expired: ${token}`);
      return NextResponse.json({ error: 'Invalid or expired approval token' }, { status: 404 });
    }

    console.log(`[PARENT-APPROVAL-CHECK] Found approval for child: ${approval.childFirstName} ${approval.childLastName}`);

    return NextResponse.json({
      success: true,
      approval: {
        id: approval._id,
        childFirstName: approval.childFirstName,
        childLastName: approval.childLastName,
        childBirthdate: approval.childBirthdate,
        parentEmail: approval.parentEmail,
        context: approval.context,
        inviteId: approval.inviteId,
        cliqId: approval.cliqId,
        inviterName: approval.inviterName,
        cliqName: approval.cliqName,
        parentState: approval.parentState,
        existingParentId: approval.existingParentId,
        status: approval.status,
        expiresAt: approval.expiresAt,
      },
    });

  } catch (error) {
    console.error('[PARENT-APPROVAL-CHECK] Error checking approval token:', error);
    return NextResponse.json({ 
      error: 'Failed to verify approval token' 
    }, { status: 500 });
  }
}

import { NextResponse, NextRequest } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const parentApprovalPlanSchema = z.object({
  approvalToken: z.string().min(1, 'Approval token is required'),
  plan: z.string().min(1, 'Plan selection is required'),
});

/**
 * POST /api/parent-approval/plan
 * 
 * Handles plan selection for new parents during the approval flow
 * This creates the parent account and links it to the pending child signup
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = parentApprovalPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.errors[0]?.message || 'Invalid request data' 
      }, { status: 400 });
    }

    const { approvalToken, plan } = parsed.data;

    console.log(`[PARENT-APPROVAL-PLAN] Processing plan selection for token: ${approvalToken}, plan: ${plan}`);

    // Get the parent approval record
    const approval = await convexHttp.query(api.parentApprovals.getParentApprovalByToken, {
      approvalToken,
    });

    if (!approval) {
      return NextResponse.json({ 
        error: 'Invalid or expired approval token' 
      }, { status: 404 });
    }

    if (approval.status !== 'pending') {
      return NextResponse.json({ 
        error: 'This approval has already been processed' 
      }, { status: 400 });
    }

    // Find the parent user (should already exist from signup)
    const parentUser = await convexHttp.query(api.users.getUserByEmail, {
      email: approval.parentEmail.toLowerCase().trim(),
    });

    console.log(`[PARENT-APPROVAL-PLAN] Found parent user:`, parentUser ? 'YES' : 'NO');
    if (parentUser) {
      console.log(`[PARENT-APPROVAL-PLAN] Parent user ID:`, parentUser._id);
    }

    if (!parentUser) {
      return NextResponse.json({ 
        error: 'Parent account not found. Please complete signup first.' 
      }, { status: 404 });
    }

    // Update the parent's plan
    const parentAccount = await convexHttp.query(api.accounts.getAccountByUserId, {
      userId: parentUser._id,
    });

    console.log(`[PARENT-APPROVAL-PLAN] Found parent account:`, parentAccount ? 'YES' : 'NO');
    if (parentAccount) {
      console.log(`[PARENT-APPROVAL-PLAN] Parent account ID:`, parentAccount._id);
      console.log(`[PARENT-APPROVAL-PLAN] Current plan:`, parentAccount.plan);
    }

    if (!parentAccount) {
      return NextResponse.json({ 
        error: 'Parent account not found' 
      }, { status: 404 });
    }

    // Update the parent's plan
    await convexHttp.mutation(api.accounts.updateAccount, {
      userId: parentUser._id,
      updates: {
        plan: plan,
        setupStage: 'plan_selected',
      },
    });

    // Mark the approval as approved now that the parent has selected a plan
    await convexHttp.mutation(api.parentApprovals.updateParentApprovalStatus, {
      approvalToken,
      status: 'approved',
    });

    console.log(`[PARENT-APPROVAL-PLAN] Successfully updated parent plan, set setup stage to 'plan_selected', and marked approval as approved`);

    return NextResponse.json({
      success: true,
      message: 'Plan selected successfully',
      user: {
        id: parentUser._id,
        email: parentUser.email,
        role: 'Parent',
        plan: plan,
      },
      child: {
        firstName: approval.childFirstName,
        lastName: approval.childLastName,
        name: `${approval.childFirstName} ${approval.childLastName}`,
        birthdate: approval.childBirthdate,
      },
    });

  } catch (error) {
    console.error('[PARENT-APPROVAL-PLAN] Error processing plan selection:', error);
    return NextResponse.json({ 
      error: 'Failed to process plan selection' 
    }, { status: 500 });
  }
}

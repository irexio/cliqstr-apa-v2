import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

const declineSchema = z.object({
  approvalToken: z.string().min(1, 'Approval token is required'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionOptions);

    if (!session.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = declineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.errors[0]?.message || 'Invalid request data' 
      }, { status: 400 });
    }

    const { approvalToken } = parsed.data;

    console.log(`[PARENT-APPROVAL-DECLINE] Declining approval token: ${approvalToken}`);

    // Decline the approval
    const result = await convexHttp.mutation(api.parentApprovals.declineParentApproval, {
      approvalToken,
    });

    if (!result) {
      return NextResponse.json({ 
        error: 'Approval not found or already processed' 
      }, { status: 404 });
    }

    console.log(`[PARENT-APPROVAL-DECLINE] Successfully declined approval for: ${result.childFirstName} ${result.childLastName}`);

    return NextResponse.json({ 
      success: true,
      message: `You have declined the invitation for ${result.childFirstName} ${result.childLastName}`,
      childName: `${result.childFirstName} ${result.childLastName}`
    });

  } catch (error: any) {
    console.error('[PARENT-APPROVAL-DECLINE] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to decline approval',
      details: error.message 
    }, { status: 500 });
  }
}

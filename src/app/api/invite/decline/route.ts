import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

const declineSchema = z.object({
  code: z.string().min(1, 'Invite code is required'),
  reason: z.optional(z.string()),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Missing invite code' }, { status: 400 });
    }

    console.log(`[INVITE-DECLINE] Processing decline for code: ${code}`);

    // Just redirect to the decline page - let the page handle the decline logic
    return NextResponse.redirect(new URL(`/invite/declined?code=${encodeURIComponent(code)}`, req.url));

  } catch (error: any) {
    console.error('[INVITE-DECLINE] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process decline request',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = declineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.errors[0]?.message || 'Invalid request data' 
      }, { status: 400 });
    }

    const { code, reason } = parsed.data;

    console.log(`[INVITE-DECLINE] Processing decline for code: ${code} with reason: ${reason}`);

    // Get invite details first
    const invite = await convexHttp.query(api.invites.getInviteByCode, { code });
    
    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Mark invite as declined with reason
    const result = await convexHttp.mutation(api.invites.declineInvite, {
      code,
      reason,
    });

    if (!result) {
      return NextResponse.json({ 
        error: 'Failed to decline invite' 
      }, { status: 500 });
    }

    console.log(`[INVITE-DECLINE] Successfully declined invite: ${code} with reason: ${reason}`);

    return NextResponse.json({ 
      success: true,
      message: 'Invitation declined successfully'
    });

  } catch (error: any) {
    console.error('[INVITE-DECLINE] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to decline invite',
      details: error.message 
    }, { status: 500 });
  }
}

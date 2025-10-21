import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/invites/pending?email=user@example.com
 * 
 * Fetches all pending invites for a given email address
 * Used for auto-joining users to cliqs after they complete signup
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailNorm = email.toLowerCase().trim();
    console.log('[INVITES_PENDING] Fetching pending invites for:', emailNorm);

    // Query invites for this email that are pending and not used
    const invites = await convexHttp.query(api.invites.getInvitesByEmail, {
      email: emailNorm,
    });

    // Filter for pending, unused invites with cliq associations
    const pendingInvites = invites
      .filter((inv: any) => 
        inv.status === 'pending' && 
        !inv.used && 
        inv.cliqId &&
        inv.inviteType === 'adult' // Only auto-join adult invites
      )
      .map((inv: any) => ({
        _id: inv._id,
        code: inv.code || inv.joinCode,
        cliqId: inv.cliqId,
        cliqName: inv.cliqName || 'A Cliq',
        inviterName: inv.inviterName || 'Someone',
        createdAt: inv.createdAt,
      }));

    console.log(`[INVITES_PENDING] Found ${pendingInvites.length} pending invites for ${emailNorm}`);

    return NextResponse.json({
      success: true,
      email: emailNorm,
      invites: pendingInvites,
      count: pendingInvites.length,
    });
  } catch (error) {
    console.error('[INVITES_PENDING] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending invites' },
      { status: 500 }
    );
  }
}

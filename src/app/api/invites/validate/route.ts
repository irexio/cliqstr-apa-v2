/**
 * 🔄 OPTIMIZED CONVEX ROUTE: GET /api/invites/validate
 * 
 * This is the rewritten version using Convex patterns:
 * - Validates invites using optimized Convex queries
 * - More efficient than the original Prisma version
 * - Enables real-time updates for invite status
 * 
 * @deprecated The original route.ts is deprecated in favor of this Convex version
 */

import { NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code')?.trim();

    if (!code) {
      return NextResponse.json(
        { valid: false, reason: 'missing_code' },
        { status: 400 }
      );
    }

    // Get invite using Convex
    const invite = await convexHttp.query(api.invites.getInviteByCode, {
      code,
    });

    const now = Date.now();
    const expired = !!invite?.expiresAt && invite.expiresAt < now;

    // Log once for traceability (no PII beyond code)
    console.log('[INVITE/VALIDATE]', {
      code,
      found: !!invite,
      status: invite?.status,
      used: invite?.used,
      expired,
      role: invite?.invitedRole,
      inviteType: invite?.inviteType,
      expiresAt: invite?.expiresAt,
      currentTime: now,
    });

    // Additional debugging for child invites
    if (invite?.inviteType === 'child' || invite?.invitedRole === 'child') {
      console.log('[INVITE/VALIDATE] Child invite details:', {
        code,
        inviteType: invite.inviteType,
        invitedRole: invite.invitedRole,
        friendFirstName: invite.friendFirstName,
        friendLastName: invite.friendLastName,
        recipientEmail: invite.inviteeEmail || invite.trustedAdultContact,
        status: invite.status,
        used: invite.used,
        expired
      });
    }

    if (!invite) {
      return NextResponse.json(
        { valid: false, reason: 'not_found' },
        { status: 404 }
      );
    }

    if (expired) {
      return NextResponse.json(
        { valid: false, reason: 'expired' },
        { status: 400 }
      );
    }

    if (invite.status !== 'pending') {
      return NextResponse.json(
        { valid: false, reason: 'not_pending' },
        { status: 400 }
      );
    }

    if (invite.used) {
      return NextResponse.json(
        { valid: false, reason: 'used' },
        { status: 400 }
      );
    }

    const inviteRole = (invite.invitedRole || '').toLowerCase();
    const recipientEmail = invite.inviteeEmail || invite.trustedAdultContact || null;

    // Get additional invite details for the response
    const cliq = invite.cliqId ? await convexHttp.query(api.cliqs.getCliqBasic, { cliqId: invite.cliqId }) : null;
    const inviterProfile = await convexHttp.query(api.profiles.getProfileByUserId, { userId: invite.inviterId });

    const res = NextResponse.json({
      valid: true,
      inviteType: invite.inviteType || inviteRole,  // 'adult' | 'child' | 'parent'
      inviteRole,         // 'adult' | 'child' (for backward compatibility)
      inviteId: invite._id,
      cliqId: invite.cliqId,
      cliqName: cliq?.name || 'Unknown Cliq',
      inviterName: inviterProfile ? `${inviterProfile.account?.firstName || ''} ${inviterProfile.account?.lastName || ''}`.trim() || inviterProfile.username || 'Someone' : 'Someone',
      friendFirstName: invite.friendFirstName,
      friendLastName: invite.friendLastName,
      childBirthdate: invite.childBirthdate,
      recipientEmail,     // used to prefill sign-up
      reason: null,
    });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err) {
    console.error('[INVITE/VALIDATE] error', err);
    return NextResponse.json(
      { valid: false, reason: 'server_error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cliqId } = await params;
    const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions);

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const targetUserId = formData.get('targetUserId') as string;
    const action = formData.get('action') as string;

    if (!targetUserId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`[MEMBER_ACTIONS] Action: ${action}, Target: ${targetUserId}, Cliq: ${cliqId}`);

    // Handle different actions
    if (action === 'promote') {
      // Promote to moderator
      await convexHttp.mutation(api.cliqs.promoteMemberToModerator, {
        cliqId: cliqId as any,
        memberId: targetUserId as any,
        requesterId: session.userId as any,
      });
      return NextResponse.json({ success: true, message: 'Member promoted to moderator' });
    } else if (action === 'demote') {
      // Demote to member (set role to 'member')
      // Note: We don't have a specific demote function, so we'd need to create one
      // For now, return not implemented
      return NextResponse.json({ error: 'Demote not yet implemented' }, { status: 501 });
    } else if (action === 'remove') {
      // Remove from cliq
      await convexHttp.mutation(api.cliqs.removeMemberFromCliq, {
        cliqId: cliqId as any,
        memberId: targetUserId as any,
        requesterId: session.userId as any,
      });
      return NextResponse.json({ success: true, message: 'Member removed from cliq' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[MEMBER_ACTIONS] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to perform member action' },
      { status: 500 }
    );
  }
}

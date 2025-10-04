import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';

export const dynamic = 'force-dynamic';

/**
 * POST /api/wizard/upgrade-to-parent
 * 
 * Upgrades an existing Adult user to Parent role
 * This is called when an existing adult approves a child
 */
export async function POST(req: NextRequest) {
  try {
    // Get the encrypted session using iron-session
    const session = await getIronSession<SessionData>(
      req,
      NextResponse.next(),
      sessionOptions
    );

    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[UPGRADE-TO-PARENT] Upgrading user ${session.userId} to Parent role`);

    // Get current user to verify they're an Adult
    const user = await convexHttp.query(api.users.getCurrentUser, {
      userId: session.userId as any,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'Parent') {
      return NextResponse.json({ 
        ok: true, 
        message: 'Already a parent account' 
      });
    }

    if (user.role === 'Child') {
      return NextResponse.json({ 
        error: 'Child accounts cannot become parents' 
      }, { status: 403 });
    }

    if (user.role !== 'Adult') {
      return NextResponse.json({ 
        error: 'Only Adult accounts can be upgraded to Parent' 
      }, { status: 403 });
    }

    // Upgrade to Parent role
    await convexHttp.mutation(api.users.upgradeToParent, {
      userId: session.userId as any,
    });

    console.log(`[UPGRADE-TO-PARENT] Successfully upgraded user ${session.userId} to Parent role`);

    return NextResponse.json({ 
      ok: true, 
      message: 'Successfully upgraded to Parent role',
      user: {
        id: session.userId,
        email: user.email,
        role: 'Parent',
      }
    });

  } catch (error: any) {
    console.error('[UPGRADE-TO-PARENT] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to upgrade to Parent role',
      details: error.message 
    }, { status: 500 });
  }
}

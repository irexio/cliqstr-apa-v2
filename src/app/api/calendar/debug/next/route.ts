import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export const dynamic = 'force-dynamic';

/**
 * DEBUG: List upcoming activities for smoke testing
 * Requires admin authentication via x-admin-secret header
 */
export async function GET(req: NextRequest) {
  try {
    // Check admin auth
    const adminSecret = req.headers.get('x-admin-secret');
    const expectedSecret = process.env.ADMIN_SECRET || 'cliqstr-admin-2025';
    
    if (adminSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cliqId = searchParams.get('cliqId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!cliqId) {
      return NextResponse.json({ error: 'cliqId is required' }, { status: 400 });
    }

    // Get upcoming activities for the cliq
    const activities = await convexHttp.query(api.events.listByCliq, {
      cliqId: cliqId as any,
      from: Date.now(),
      to: Date.now() + days * 24 * 60 * 60 * 1000,
    });

    return NextResponse.json({
      success: true,
      cliqId,
      days,
      count: activities.length,
      activities: activities.map((a: any) => ({
        id: a._id,
        title: a.title,
        startAt: new Date(a.startAt).toISOString(),
        endAt: new Date(a.endAt).toISOString(),
        location: a.location,
        requiresApproval: a.requiresParentApproval,
        rsvpCount: Object.keys(a.rsvps || {}).length,
      })),
    });
  } catch (error) {
    console.error('[CALENDAR_DEBUG] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

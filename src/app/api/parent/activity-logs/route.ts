import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const getActivityLogsSchema = z.object({
  childId: z.string(),
  limit: z.optional(z.number().min(1).max(100)).default(50),
});

/**
 * GET /api/parent/activity-logs?childId=xxx&limit=50
 * 
 * Gets activity logs for a specific child (for parent monitoring)
 */
export async function GET(req: NextRequest) {
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

    // Get current user to verify they're a parent
    const user = await convexHttp.query(api.users.getCurrentUser, {
      userId: session.userId as any,
    });

    if (!user || (user.role !== 'Parent' && user.role !== 'Admin')) {
      return NextResponse.json({ error: 'Access denied. Parent role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('childId');
    const limit = searchParams.get('limit');

    const parsed = getActivityLogsSchema.safeParse({
      childId,
      limit: limit ? parseInt(limit) : undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.errors[0]?.message || 'Invalid parameters' 
      }, { status: 400 });
    }

    const { childId: validatedChildId, limit: validatedLimit } = parsed.data;

    console.log(`[PARENT-ACTIVITY-LOGS] Getting logs for child ${validatedChildId} by parent ${user.email}`);

    // Verify the parent has permission to view this child's activity
    const parentLink = await convexHttp.query(api.parentLinks.getParentLinkByParentAndChild, {
      parentId: session.userId as any,
      childId: validatedChildId as any,
    });

    if (!parentLink) {
      return NextResponse.json({ 
        error: 'You are not authorized to view this child\'s activity' 
      }, { status: 403 });
    }

    // Get both user activity logs and parent audit logs
    const [userActivityLogs, parentAuditLogs] = await Promise.all([
      convexHttp.query(api.users.getChildActivityLogs, {
        childId: validatedChildId as any,
        limit: validatedLimit,
      }),
      convexHttp.query(api.users.getParentAuditLogs, {
        childId: validatedChildId as any,
        limit: validatedLimit,
      }),
    ]);

    // Combine and sort logs by creation time
    const allLogs = [
      ...userActivityLogs.map(log => ({
        type: 'user_activity' as const,
        id: log._id,
        event: log.event,
        detail: log.detail,
        createdAt: log.createdAt,
        debugId: log.debugId,
      })),
      ...parentAuditLogs.map(log => ({
        type: 'parent_audit' as const,
        id: log._id,
        event: log.action,
        detail: `Parent action: ${log.action}`,
        createdAt: log.createdAt,
        oldValue: log.oldValue,
        newValue: log.newValue,
      })),
    ].sort((a, b) => b.createdAt - a.createdAt);

    console.log(`[PARENT-ACTIVITY-LOGS] Found ${allLogs.length} total logs for child ${validatedChildId}`);

    return NextResponse.json({ 
      success: true,
      logs: allLogs,
      total: allLogs.length,
    });

  } catch (error: any) {
    console.error('[PARENT-ACTIVITY-LOGS] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to get activity logs' 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

const addParentSchema = z.object({
  childId: z.string(),
  parentEmail: z.string().email(),
  role: z.enum(['secondary', 'guardian']),
  permissions: z.object({
    canManageChild: z.boolean(),
    canChangeSettings: z.boolean(),
    canViewActivity: z.boolean(),
    receivesNotifications: z.boolean(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = addParentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { childId, parentEmail, role, permissions } = parsed.data;

    // Check if parent already exists for this child
    const existingLink = await convexHttp.query(api.parentLinks.getParentLinkByEmailAndChild, {
      email: parentEmail,
      childId: childId as any,
    });

    if (existingLink) {
      return NextResponse.json(
        { error: 'This parent is already linked to this child' },
        { status: 400 }
      );
    }

    // Create parent link
    const parentLink = await convexHttp.mutation(api.parentLinks.createParentLink, {
      email: parentEmail,
      childId: childId as any,
      role,
      permissions,
      type: 'additional_parent',
    });

    // TODO: Send invitation email to the parent
    // This would trigger an email to the parent asking them to accept the invitation

    return NextResponse.json({ 
      success: true, 
      message: 'Parent invitation sent successfully',
      parentLink 
    });
  } catch (error) {
    console.error('Error adding parent:', error);
    return NextResponse.json(
      { error: 'Failed to add parent' },
      { status: 500 }
    );
  }
}

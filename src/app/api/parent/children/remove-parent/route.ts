import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

const removeParentSchema = z.object({
  childId: z.string(),
  parentId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = removeParentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { childId, parentId } = parsed.data;

    // Remove parent link
    await convexHttp.mutation(api.parentLinks.removeParentLink, {
      parentId: parentId as any,
      childId: childId as any,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Parent removed successfully' 
    });
  } catch (error) {
    console.error('Error removing parent:', error);
    return NextResponse.json(
      { error: 'Failed to remove parent' },
      { status: 500 }
    );
  }
}

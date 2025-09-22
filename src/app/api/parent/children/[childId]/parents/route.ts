import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { childId: string } }
) {
  try {
    const { childId } = params;

    // Get all parent links for this child
    const parentLinks = await convexHttp.query(api.parentLinks.getParentLinksByChildId, {
      childId: childId as any,
    });

    return NextResponse.json({ parents: parentLinks });
  } catch (error) {
    console.error('Error fetching parents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parents' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

/**
 * 🔐 APA-HARDENED ROUTE: POST /api/posts/create
 *
 * Purpose:
 *   - Creates a new post inside a specific cliq
 *   - Supports optional image and text content
 *   - Sets default expiration at 90 days
 *
 * Auth:
 *   - Uses getCurrentUser() for session validation
 *
 * Input Body:
 *   {
 *     content?: string,
 *     image?: string (URL),
 *     cliqId: string
 *   }
 *
 * Returns:
 *   - 200 OK + new post
 *   - 401 if unauthenticated
 *   - 400 if invalid input or missing content
 *   - 500 on DB/server error
 */

import { NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
// Note: Membership verification is now handled by Convex functions automatically
import { z } from 'zod';

const schema = z.object({
  content: z.string().optional(),
  image: z.string().url().optional(),
  cliqId: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return new NextResponse('Invalid input', { status: 400 });
  }

  const { content, image, cliqId } = result.data;

  if (!content && !image) {
    return new NextResponse('Post must include content or an image.', { status: 400 });
  }

  // 🔒 CRITICAL: Check child permissions and compliance
  if (user.account?.role === 'Child') {
    // Check if child has valid parent consent
    const hasConsent = await convexHttp.query(api.parentConsents.hasValidParentConsent, {
      childId: user.id as any,
    });
    
    if (!hasConsent.hasConsent) {
      return new NextResponse('Child account incomplete, parent approval required.', { status: 403 });
    }
    
    // Check child settings exist
    const childSettings = await convexHttp.query(api.users.getChildSettings, {
      profileId: user.myProfile!.id as any,
    });
    
    if (!childSettings) {
      return new NextResponse('Child account incomplete, parent approval required.', { status: 403 });
    }
    
    // Check specific permissions
    if (image && !childSettings.canPostImages) {
      return new NextResponse('You do not have permission to post images. Please ask your parent to enable this feature.', { status: 403 });
    }
  }
  
  // Note: Membership verification is now handled by Convex functions automatically

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  try {
    const post = await convexHttp.mutation(api.posts.createPost, {
      content: content || '',
      image: image || undefined,
      cliqId: cliqId as any,
      authorId: user.id as any,
      expiresAt: expiresAt.getTime(),
    });

    return NextResponse.json(post);
  } catch (err) {
    console.error('❌ Post creation error:', err);
    return new NextResponse('Server error', { status: 500 });
  }
}

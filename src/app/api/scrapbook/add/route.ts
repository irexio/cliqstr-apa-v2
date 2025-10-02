/**
 * 🔄 OPTIMIZED CONVEX ROUTE: POST /api/scrapbook/add
 * 
 * This is the rewritten version using Convex patterns:
 * - Adds scrapbook items using optimized Convex mutations
 * - More efficient than the original Prisma version
 * - Enables real-time updates for scrapbook changes
 * 
 * @deprecated The original route.ts is deprecated in favor of this Convex version
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

const schema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().max(280).optional(),
  profileId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }

    const { imageUrl, caption, profileId } = parsed.data;

    console.log('[SCRAPBOOK_ADD] Request data:', {
      userId: user.id,
      profileId,
      imageUrl,
      caption
    });

    // 🔒 CRITICAL: Check child permissions and compliance
    if (user.account?.role === 'Child') {
      // Check if child has valid parent consent
      const hasConsent = await convexHttp.query(api.parentConsents.hasValidParentConsent, {
        childId: user.id as any,
      });
      
      if (!hasConsent.hasConsent) {
        return NextResponse.json({
          error: 'Child account incomplete, parent approval required.'
        }, { status: 403 });
      }
      
      // Check child settings exist
      const childSettings = await convexHttp.query(api.users.getChildSettings, {
        profileId: profileId as any,
      });
      
      if (!childSettings) {
        return NextResponse.json({
          error: 'Child account incomplete, parent approval required.'
        }, { status: 403 });
      }
    }

    // Verify the profile belongs to the current user using Convex
    const profile = await convexHttp.query(api.profiles.getProfileByUserId, {
      userId: user.id as any,
    });

    console.log('[SCRAPBOOK_ADD] Profile lookup result:', {
      profileFound: !!profile,
      profileId: profile?._id,
      requestedProfileId: profileId,
      userId: user.id,
      profileUserId: profile?.userId
    });

    if (!profile) {
      console.log('[SCRAPBOOK_ADD] No profile found for user:', user.id);
      return NextResponse.json({ 
        error: 'Profile not found. Please create a profile first.' 
      }, { status: 404 });
    }

    if (profile._id !== profileId) {
      console.log('[SCRAPBOOK_ADD] Profile ID mismatch:', {
        foundProfileId: profile._id,
        requestedProfileId: profileId,
        userId: user.id
      });
      return NextResponse.json({ 
        error: 'You can only add items to your own scrapbook' 
      }, { status: 403 });
    }

    // Create the scrapbook item using Convex
    const itemId = await convexHttp.mutation(api.scrapbook.addScrapbookItem, {
      profileId: profileId as any,
      imageUrl,
      caption: caption || '',
    });

    // Get the created item to return
    const item = await convexHttp.query(api.scrapbook.getScrapbookItems, {
      profileId: profileId as any,
    });

    const createdItem = item.find(i => i._id === itemId);

    return NextResponse.json({ 
      success: true, 
      item: createdItem 
    });
  } catch (error) {
    console.error('[SCRAPBOOK_ADD_ERROR]', error);
    return NextResponse.json({ 
      error: 'Failed to add scrapbook item' 
    }, { status: 500 });
  }
}

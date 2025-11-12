/**
 * 🔐 APA-HARDENED ROUTE: POST /api/cliqs/create
 *
 * Purpose:
 *   - Creates a new cliq for the authenticated user
 *   - Adds the creator to the cliq's membership
 *
 * Auth:
 *   - Requires valid session (user.id)
 *
 * Body:
 *   - name: string
 *   - description?: string
 *   - privacy: 'private' | 'semi' | 'public'
 *   - coverImage?: string (optional; uses default if blank)
 *
 * Returns:
 *   - 200 OK + new cliq
 *   - 401 if unauthorized
 *   - 400 if invalid input
 *   - 500 on error
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { z } from 'zod';
import { isValidPlan } from '@/lib/utils/planUtils';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  privacy: z.enum(['private', 'semi', 'public']),
  coverImage: z.string().refine(
    (url) => url === '' || url.startsWith('/IMAGE-FEATURE/') || url.startsWith('http'),
    'Invalid image URL'
  ).optional().or(z.literal('')),
  minAge: z.number().int().min(1).max(100).optional().nullable(),
  maxAge: z.number().int().min(1).max(100).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Profile is optional for cliq creation - users can create cliqs without profiles
    // They'll use default avatars and can complete their profile later
    
    // Simplified plan validation - only check if plan exists
    if (!user.plan) {
      console.log('[APA] User missing plan in /api/cliqs/create');
      return NextResponse.json({ error: 'Missing plan' }, { status: 403 });
    }

    const body = await req.json();

    // Normalize privacy casing and default the coverImage field
    body.privacy = body.privacy?.toLowerCase(); // ensures 'Private' becomes 'private'
    if (!body.coverImage) body.coverImage = '';

    // Validate input
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { name, description, privacy, coverImage, minAge, maxAge } = parsed.data;

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
      
      // Children without profiles cannot create cliqs
      if (!user.myProfile) {
        console.log(`[APA] Child without profile blocked from creating cliq:`, user.email);
        return NextResponse.json({
          error: 'You need to create a profile first to create cliqs'
        }, { status: 403 });
      }
      
      // Get child settings to check parental permissions
      const childSettings = await convexHttp.query(api.users.getChildSettings, {
        profileId: user.myProfile.id as any,
      });
      
      if (!childSettings) {
        return NextResponse.json({
          error: 'Child account incomplete, parent approval required.'
        }, { status: 403 });
      }
      
      // Check specific permissions for public/semi cliqs
      if ((privacy === 'public' || privacy === 'semi') && !childSettings.canCreatePublicCliqs) {
        console.log(`[APA] Child blocked from creating ${privacy} cliq:`, user.email);
        return NextResponse.json({
          error: 'You do not have permission to create public cliqs. Please ask your parent to enable this feature.'
        }, { status: 403 });
      }
      
      // Check general cliq creation permission
      if (!childSettings.canCreateCliqs) {
        return NextResponse.json({
          error: 'You do not have permission to create cliqs. Please ask your parent to enable this feature.'
        }, { status: 403 });
      }
    }

    // Validate age range if both are provided
    if (minAge && maxAge && minAge >= maxAge) {
      return NextResponse.json({ 
        error: 'Minimum age must be less than maximum age' 
      }, { status: 400 });
    }


    const DEFAULT_IMAGE = '/images/default-gradient.png';
    const finalCoverImage =
      coverImage && coverImage.length > 0 ? coverImage : DEFAULT_IMAGE;

    let finalPrivacy: 'private' | 'public' | 'semi_private' = privacy as any;
    if (privacy === 'semi') {
      finalPrivacy = 'semi_private';
    }

    const cliqId = await convexHttp.mutation(api.cliqs.createCliq, {
      name,
      description,
      privacy: finalPrivacy,
      coverImage: finalCoverImage,
      minAge: minAge || undefined,
      maxAge: maxAge || undefined,
      creatorId: user.id as any,
    });

    console.log(`[CREATE_CLIQ_SUCCESS] Created cliq ${cliqId} for user ${user.id}`);
    return NextResponse.json({ 
      cliqId,
      success: true,
      message: 'Cliq created successfully'
    });
  } catch (error) {
    console.error('[CREATE_CLIQ_ERROR]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

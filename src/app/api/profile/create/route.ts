/**
 * 🔄 CONVEX ROUTE: POST /api/profile/create
 * 
 * This is the Convex version for profile creation:
 * - Creates profiles using optimized Convex mutations
 * - More efficient than the original Prisma version
 * - Enables real-time updates for profile changes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';
import { getAgeGroup } from '@/lib/ageUtils';

const schema = z.object({
  // ❌ SECURITY: Account fields should NOT be editable through profile creation
  // firstName: z.string().min(1), // REMOVED
  // lastName: z.string().min(1),  // REMOVED
  // birthdate: z.string().transform(...), // REMOVED

  // ✅ MyProfile fields only (social profile)
  username: z.string().min(3).max(15).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().max(50).optional(), // Nickname for social display
  about: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
  bannerImage: z.string().url().optional().or(z.literal('')),
  showYear: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a MyProfile
    if (user.myProfile) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }

    const { username, displayName, about, image, bannerImage, showYear } = parsed.data;

    // Check if username is taken using Convex
    const existingProfile = await convexHttp.query(api.profiles.getProfileByUsername, {
      username
    });

    if (existingProfile) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    // Get account data for age calculation
    const account = await convexHttp.query(api.accounts.getAccountByUserId, {
      userId: user.id as any,
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Calculate age group from Account birthdate
    const { group } = getAgeGroup(new Date(account.birthdate).toISOString());

    // SECURITY: Only create MyProfile fields - Account data comes from Account table
    const profileId = await convexHttp.mutation(api.profiles.createProfile, {
      userId: user.id as any,
      username,
      displayName: displayName || undefined,
      about: about || '',
      image: image || '',
      bannerImage: bannerImage || '',
      showYear,
      showMonthDay: true, // Default: show birthday to cliq members
      ageGroup: group,
      aiModerationLevel: group === 'child' ? 'strict' : 'moderate',
    });

    // If child, create default child settings using Convex
    if (group === 'child') {
      await convexHttp.mutation(api.users.createChildSettings, {
        profileId: profileId as any,
        canSendInvites: false,
        inviteRequiresApproval: true,
        canCreatePublicCliqs: false,
        canPostImages: true, // Allow children to post to their scrapbook
      });
    }

    // Get the created profile to return
    const profile = await convexHttp.query(api.profiles.getProfileByUserId, {
      userId: user.id as any,
    });

    return NextResponse.json({ 
      success: true, 
      profile,
      username: profile?.username,
      message: 'Profile created successfully' 
    });
  } catch (error) {
    console.error('[PROFILE_CREATE_ERROR]', error);
    return NextResponse.json({ 
      error: 'Failed to create profile' 
    }, { status: 500 });
  }
}

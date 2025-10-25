/**
 * 🔄 OPTIMIZED CONVEX ROUTE: POST /api/profile/update
 * 
 * This is the rewritten version using Convex patterns:
 * - Updates profiles using optimized Convex mutations
 * - More efficient than the original Prisma version
 * - Enables real-time updates for profile changes
 * 
 * @deprecated The original route.ts is deprecated in favor of this Convex version
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateProfileSchema = z.object({
  // ❌ SECURITY: Account fields should NOT be editable through MyProfile
  // firstName: z.string().max(50).optional().nullable(), // REMOVED
  // lastName: z.string().max(50).optional().nullable(),  // REMOVED
  // birthdate: z.string().datetime().optional().nullable(), // REMOVED

  // ✅ MyProfile fields only (social profile)
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores and hyphens').optional(),
  displayName: z.string().max(50).optional().nullable(), // Nickname for social display
  about: z.string().max(500).optional().nullable(),
  image: z.union([z.string().url(), z.literal('')]).optional().nullable(),
  bannerImage: z.union([z.string().url(), z.literal('')]).optional().nullable(),
  showYear: z.boolean().optional(),
  aiModerationLevel: z.enum(['strict', 'moderate', 'relaxed']).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { username, displayName, about, image, bannerImage, showYear, aiModerationLevel } = parsed.data;

    // Get current profile to get profileId
    const currentProfile = await convexHttp.query(api.profiles.getProfileByUserId, {
      userId: user.id as any,
    });

    if (!currentProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if username is already taken (excluding current user) - only if username is provided
    if (username) {
      const existingProfile = await convexHttp.query(api.profiles.getProfileByUsername, {
        username
      });

      if (existingProfile && existingProfile._id !== currentProfile._id) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
    }

    // SECURITY: All Account fields have been removed from the schema
    // Only MyProfile fields (username, displayName, about, etc.) are allowed

    // Build update data object with only MyProfile fields
    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (displayName !== undefined) {
      if (displayName !== null) updateData.displayName = displayName;
      // Omit entirely if null to allow optional fields to stay undefined
    }
    if (about !== undefined) {
      if (about !== null) updateData.about = about;
    }
    if (image !== undefined) {
      if (image !== null) updateData.image = image;
    }
    if (bannerImage !== undefined) {
      if (bannerImage !== null) updateData.bannerImage = bannerImage;
    }
    if (showYear !== undefined) updateData.showYear = showYear;
    if (aiModerationLevel !== undefined) updateData.aiModerationLevel = aiModerationLevel;

    // Update profile using Convex
    await convexHttp.mutation(api.profiles.updateProfile, {
      profileId: currentProfile._id,
      updates: updateData,
    });

    // Get updated profile
    const updatedProfile = await convexHttp.query(api.profiles.getProfileByUserId, {
      userId: user.id as any,
    });

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile,
      username: updatedProfile?.username,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

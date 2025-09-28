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
  firstName: z.string().max(50).optional().nullable(),
  lastName: z.string().max(50).optional().nullable(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/, 
    'Username can only contain letters, numbers, underscores and hyphens').optional(),
  about: z.string().max(500).optional().nullable(),
  birthdate: z.string().datetime().optional().nullable(),
  image: z.string().url().optional().nullable(),
  bannerImage: z.string().url().optional().nullable(),
  showYear: z.boolean().optional(),
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

    const { firstName, lastName, username, about, birthdate, image, bannerImage, showYear } = parsed.data;

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

    // Build update data object with only provided fields
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName || null;
    if (lastName !== undefined) updateData.lastName = lastName || null;
    if (username !== undefined) updateData.username = username;
    if (about !== undefined) updateData.about = about || null;
    if (birthdate !== undefined) updateData.birthdate = birthdate ? new Date(birthdate).getTime() : null;
    if (image !== undefined) updateData.image = image || null;
    if (bannerImage !== undefined) updateData.bannerImage = bannerImage || null;
    if (showYear !== undefined) updateData.showYear = showYear;

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

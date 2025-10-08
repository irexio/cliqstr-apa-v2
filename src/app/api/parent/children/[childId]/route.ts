import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { ConvexHttpClient } from 'convex/browser';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

const convexHttp = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Input validation schemas
const updateChildSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  childEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  firstName: z.string().min(1, 'First name required').max(50, 'First name too long').regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
  lastName: z.string().min(1, 'Last name required').max(50, 'Last name too long').regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
  // SECURITY: birthdate is intentionally immutable to prevent age manipulation
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long').optional(),
  currentPassword: z.string().min(1, 'Current password required for verification').optional(),
  silentMonitoring: z.boolean().optional(),
  secondParentEmail: z.string().email('Invalid second parent email').optional().or(z.literal('')),
  permissions: z.object({
    canPost: z.boolean(),
    canComment: z.boolean(),
    canReact: z.boolean(),
    canViewProfiles: z.boolean(),
    canReceiveInvites: z.boolean(),
    canCreatePublicCliqs: z.boolean(),
    canInviteChildren: z.boolean(),
    canInviteAdults: z.boolean(),
    canCreateCliqs: z.boolean(),
    canUploadVideos: z.boolean(),
    invitesRequireParentApproval: z.boolean(),
  }).optional(),
}).refine(
  (data) => {
    // If password is provided, currentPassword must also be provided
    if (data.password && data.password.trim()) {
      return data.currentPassword && data.currentPassword.trim();
    }
    return true;
  },
  {
    message: "Current password is required when changing password",
    path: ["currentPassword"],
  }
);

export async function GET(
  request: NextRequest,
  { params }: { params: { childId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.account?.role !== 'Parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate parent account status
    if (user.account?.suspended) {
      return NextResponse.json({ error: 'Parent account suspended' }, { status: 403 });
    }

    const childId = params.childId;
    
    // Validate childId format
    if (!childId || typeof childId !== 'string' || childId.length < 10) {
      return NextResponse.json({ error: 'Invalid child ID' }, { status: 400 });
    }

    console.log(`[PARENT-CHILDREN-GET] Fetching child details for ID: ${childId} by parent: ${user.id}`);

    // Verify this child is linked to the current parent FIRST (security check)
    const parentLinks = await convexHttp.query(api.parentLinks.getParentLinksByChildId, { childId: childId as any });
    const parentLink = parentLinks.find(link => link.parentId === user.id);
    if (!parentLink) {
      console.log(`[PARENT-CHILDREN-GET] Access denied - child ${childId} not linked to parent ${user.id}`);
      return NextResponse.json({ error: 'Child not linked to parent' }, { status: 403 });
    }

    // Get child details (only after authorization check)
    const child = await convexHttp.query(api.users.getCurrentUser, { userId: childId as any });
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Check if child account is suspended
    if (child.account?.suspended) {
      return NextResponse.json({ error: 'Child account suspended' }, { status: 403 });
    }

    // Get child's profile (only for username and settings, NOT for names/birthdate)
    const profile = await convexHttp.query(api.profiles.getProfileByUserId, { userId: childId as any });
    
    // Get child's settings (using profileId)
    const settings = profile ? await convexHttp.query(api.users.getChildSettings, { profileId: profile._id as any }) : null;

    // Log access for audit trail
    console.log(`[PARENT-CHILDREN-GET] Successfully accessed child ${childId} by parent ${user.id}`);

    return NextResponse.json({
      child: {
        id: child.id,
        username: child.myProfile?.username || '',
        email: child.email,
        // SECURITY: Names and birthdate come ONLY from Account (single source of truth)
        firstName: child.account?.firstName || '',
        lastName: child.account?.lastName || '',
        birthdate: child.account?.birthdate || '',
        // SECURITY: Remove parentEmail from response to prevent data leakage
        silentMonitoring: settings?.isSilentlyMonitored ?? true,
        // Note: secondParentEmail and permissions would need separate storage/handling
        permissions: {
          canPost: true,
          canComment: true,
          canReact: true,
          canViewProfiles: true,
          canReceiveInvites: true,
          canCreatePublicCliqs: false,
          canInviteChildren: false,
          canInviteAdults: false,
          canCreateCliqs: false,
          canUploadVideos: false,
          invitesRequireParentApproval: true,
        },
      },
    });
  } catch (error: any) {
    console.error('[PARENT-CHILDREN-GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch child details' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { childId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.account?.role !== 'Parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate parent account status
    if (user.account?.suspended) {
      return NextResponse.json({ error: 'Parent account suspended' }, { status: 403 });
    }

    const childId = params.childId;
    
    // Validate childId format
    if (!childId || typeof childId !== 'string' || childId.length < 10) {
      return NextResponse.json({ error: 'Invalid child ID' }, { status: 400 });
    }

    const body = await request.json();
    
    // SECURITY: Remove sensitive data from logs
    const sanitizedBody = { ...body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.currentPassword) sanitizedBody.currentPassword = '[REDACTED]';
    
    console.log(`[PARENT-CHILDREN-PUT] Updating child ${childId} by parent ${user.id}:`, sanitizedBody);

    // Validate input data
    const validationResult = updateChildSchema.safeParse(body);
    if (!validationResult.success) {
      console.log(`[PARENT-CHILDREN-PUT] Validation failed for child ${childId}:`, validationResult.error.errors);
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Verify this child is linked to the current parent FIRST
    const parentLinks = await convexHttp.query(api.parentLinks.getParentLinksByChildId, { childId: childId as any });
    const parentLink = parentLinks.find(link => link.parentId === user.id);
    if (!parentLink) {
      console.log(`[PARENT-CHILDREN-PUT] Access denied - child ${childId} not linked to parent ${user.id}`);
      return NextResponse.json({ error: 'Child not linked to parent' }, { status: 403 });
    }

    // Get child details to verify account status
    const child = await convexHttp.query(api.users.getCurrentUser, { userId: childId as any });
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Check if child account is suspended
    if (child.account?.suspended) {
      return NextResponse.json({ error: 'Child account suspended' }, { status: 403 });
    }

    // CRITICAL SECURITY: Require current password for ANY changes to child account
    if (!validatedData.currentPassword || !validatedData.currentPassword.trim()) {
      return NextResponse.json({ 
        error: 'Current password required to make any changes' 
      }, { status: 400 });
    }

    // Get child user with password for verification
    const childWithPassword = await convexHttp.query(api.users.getUserForSignIn, {
      email: child.email,
    });
    
    if (!childWithPassword || !childWithPassword.password) {
      return NextResponse.json({ error: 'Unable to verify password' }, { status: 500 });
    }

    // Verify current password before making ANY changes
    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(validatedData.currentPassword, childWithPassword.password);
    if (!isCurrentPasswordValid) {
      console.log(`[PARENT-CHILDREN-PUT] Invalid current password for child ${childId} by parent ${user.id}`);
      return NextResponse.json({ 
        error: 'Current password is incorrect' 
      }, { status: 400 });
    }

    // Log the update attempt for audit trail
    console.log(`[PARENT-CHILDREN-PUT] Password verified, proceeding with updates for child ${childId} by parent ${user.id}`);

    // Update child's username if provided (username is stored in profile)
    if (validatedData.username) {
      const profile = await convexHttp.query(api.profiles.getProfileByUserId, { userId: childId as any });
      if (profile) {
        await convexHttp.mutation(api.profiles.updateProfile, {
          profileId: profile._id,
          updates: {
            username: validatedData.username,
          },
        });
      }
    }

    // Update child's email if provided
    if (validatedData.childEmail) {
      await convexHttp.mutation(api.users.updateUser, {
        userId: childId as any,
        updates: {
          email: validatedData.childEmail,
        },
      });
    }

    // SECURITY: Names should ONLY be updated in Account, not MyProfile
    // This prevents the security vulnerability where someone could change their social profile
    // to show different name than their verified Account
    // Note: birthdate is intentionally immutable in Account to prevent age manipulation
    if (validatedData.firstName || validatedData.lastName) {
      await convexHttp.mutation(api.accounts.updateAccount, {
        userId: childId as any,
        updates: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
        },
      });
    }

    // Update child's settings
    if (validatedData.silentMonitoring !== undefined) {
      const profile = await convexHttp.query(api.profiles.getProfileByUserId, { userId: childId as any });
      if (profile) {
        await convexHttp.mutation(api.users.updateChildSettings, {
          profileId: profile._id as any,
          parentId: user.id as any, // For audit logging
          isSilentlyMonitored: validatedData.silentMonitoring,
          // Note: secondParentEmail and permissions would need separate handling
          // as they're not part of the child settings schema
        });
      }
    }

    // Update password if provided (already verified current password above)
    if (validatedData.password && validatedData.password.trim()) {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);
      
      await convexHttp.mutation(api.users.updateUser, {
        userId: childId as any,
        updates: {
          password: hashedPassword,
        },
      });
      
      console.log(`[PARENT-CHILDREN-PUT] Password updated for child ${childId} by parent ${user.id}`);
    }

    // Log successful update for audit trail
    console.log(`[PARENT-CHILDREN-PUT] Successfully updated child ${childId} by parent ${user.id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PARENT-CHILDREN-PUT] Error:', error);
    return NextResponse.json({ error: 'Failed to update child' }, { status: 500 });
  }
}

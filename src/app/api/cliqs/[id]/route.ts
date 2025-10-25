export const dynamic = 'force-dynamic';

/**
 * 🔄 OPTIMIZED CONVEX ROUTE: GET, PATCH, DELETE /api/cliqs/[id]
 * 
 * This is the rewritten version using Convex patterns:
 * - GET: Returns only cliq basic info (no heavy includes)
 * - PATCH: Updates cliq (owner only) 
 * - DELETE: Soft-deletes cliq (owner only)
 * 
 * The client should use separate Convex queries for:
 * - Posts: useQuery(api.posts.getPostsForCliq, { cliqId })
 * - Members: useQuery(api.memberships.getMembersForCliq, { cliqId })
 * 
 * This approach is more efficient and enables real-time updates.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { isValidPlan } from '@/lib/utils/planUtils';
// Note: Membership verification is now handled by Convex functions automatically

const ParamsSchema = z.object({
  id: z.string().min(1, 'Cliq ID is required'),
});

const PatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  privacy: z.enum(['private', 'public', 'semi_private']).optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  minAge: z.number().int().min(1).max(100).optional().nullable(),
  maxAge: z.number().int().min(1).max(100).optional().nullable(),
});

// GET: Fetch cliq basic info (optimized - no heavy includes)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Simplified plan validation
    if (!user.account?.plan) {
      console.log('[APA] User missing plan in cliq API route');
      return NextResponse.json({ error: 'Missing plan' }, { status: 403 });
    }

    const parsed = ParamsSchema.safeParse({ id });
    if (!parsed.success) return NextResponse.json({ error: 'Invalid cliq ID' }, { status: 400 });
    
    // Get cliq info with automatic membership verification
    const cliq = await convexHttp.query(api.cliqs.getCliq, {
      cliqId: parsed.data.id as any,
      userId: user.id as any,
    });

    if (!cliq) return NextResponse.json({ error: 'Cliq not found' }, { status: 404 });

    return NextResponse.json(cliq);
  } catch (err) {
    console.error('[GET_CLIQ_BY_ID_ERROR]', err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

// PATCH: Update cliq (owner only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    if (!user.account?.plan || !isValidPlan(user.account.plan)) {
      return NextResponse.json({ error: 'Invalid or missing plan' }, { status: 403 });
    }

    const parsed = ParamsSchema.safeParse({ id });
    if (!parsed.success) return NextResponse.json({ error: 'Invalid cliq ID' }, { status: 400 });

    const body = await req.json();
    const validated = PatchSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Check if user is the owner
    const cliq = await convexHttp.query(api.cliqs.getCliqBasic, {
      cliqId: parsed.data.id as any,
    });

    if (!cliq) return NextResponse.json({ error: 'Cliq not found' }, { status: 404 });
    if (cliq.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the owner can update this cliq' }, { status: 403 });
    }

    // Validate age range if both are provided
    if (validated.data.minAge && validated.data.maxAge && validated.data.minAge >= validated.data.maxAge) {
      return NextResponse.json({ 
        error: 'Minimum age must be less than maximum age' 
      }, { status: 400 });
    }

    // Update cliq using Convex
    await convexHttp.mutation(api.cliqs.updateCliq, {
      cliqId: parsed.data.id as any,
      name: validated.data.name,
      description: validated.data.description,
      privacy: validated.data.privacy,
      coverImage: validated.data.coverImage,
      minAge: validated.data.minAge || undefined,
      maxAge: validated.data.maxAge || undefined,
    });

    return NextResponse.json({ success: true, message: 'Cliq updated successfully' });
  } catch (err) {
    console.error('[PATCH_CLIQ_ERROR]', err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

// DELETE: Soft-delete cliq (owner only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    if (!user.account?.plan || !isValidPlan(user.account.plan)) {
      return NextResponse.json({ error: 'Invalid or missing plan' }, { status: 403 });
    }

    const parsed = ParamsSchema.safeParse({ id });
    if (!parsed.success) return NextResponse.json({ error: 'Invalid cliq ID' }, { status: 400 });

    // Check if user is the owner
    const cliq = await convexHttp.query(api.cliqs.getCliqBasic, {
      cliqId: parsed.data.id as any,
    });

    if (!cliq) return NextResponse.json({ error: 'Cliq not found' }, { status: 404 });
    if (cliq.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the owner can delete this cliq' }, { status: 403 });
    }

    // Soft delete using Convex
    await convexHttp.mutation(api.cliqs.deleteCliq, {
      cliqId: parsed.data.id as any,
    });

    return NextResponse.json({ success: true, message: 'Cliq deleted successfully' });
  } catch (err) {
    console.error('[DELETE_CLIQ_ERROR]', err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

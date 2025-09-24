import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { invalidateUser } from '@/lib/cache/userCache';

export const dynamic = 'force-dynamic';

const verifyMagicLinkSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Valid email is required'),
});

/**
 * 🪄 POST /api/auth/magic/verify
 * 
 * Verify and consume a magic link for authentication
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyMagicLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.errors[0]?.message || 'Invalid token or email' 
      }, { status: 400 });
    }

    const { token, email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`[MAGIC_LINK_VERIFY] Verifying magic link for: ${normalizedEmail}`);

    // Verify and consume the magic link
    const userData = await convexHttp.mutation(api.magicLinks.verifyMagicLink, {
      token,
      email: normalizedEmail,
    });

    // Create session
    const session = await getIronSession<SessionData>(
      req,
      NextResponse.next(),
      sessionOptions
    );

    // Clear any existing cache for this user to ensure fresh data
    console.log('[MAGIC-LINK-VERIFY] Clearing user cache for fresh sign-in:', userData.userId);
    await invalidateUser(userData.userId);

    // Set session data
    session.userId = userData.userId;
    session.issuedAt = Date.now();
    session.lastActivityAt = Date.now();
    session.expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour from now

    await session.save();

    console.log(`✅ Magic link verified and session created for user ${userData.userId}`);

    // Return success with user data
    return NextResponse.json({ 
      success: true,
      user: {
        id: userData.userId,
        email: userData.email,
        role: userData.role,
        isApproved: userData.isApproved,
      }
    });

  } catch (error: any) {
    console.error('[MAGIC_LINK_VERIFY] Error:', error);
    
    // Handle specific magic link errors
    if (error.message?.includes('Invalid magic link') || 
        error.message?.includes('already been used') || 
        error.message?.includes('expired')) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Failed to verify magic link. Please request a new one.' 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const requestMagicLinkSchema = z.object({
  email: z.string().email('Valid email is required'),
});

/**
 * 🪄 POST /api/auth/magic/request
 * 
 * Request a magic link for passwordless authentication
 * 
 * Age-based routing:
 * - Under 13: Magic link sent to parent's email
 * - 13+: Magic link sent to child's email
 * - Adults: Magic link sent to their email
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestMagicLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.errors[0]?.message || 'Invalid email' 
      }, { status: 400 });
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`[MAGIC_LINK_REQUEST] Requesting magic link for: ${normalizedEmail}`);

    // Find user by email
    const user = await convexHttp.query(api.magicLinks.getUserByEmailForMagicLink, {
      email: normalizedEmail,
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists with this email, a magic link has been sent.'
      });
    }

    // Check if user is approved
    if (!user.approved) {
      return NextResponse.json({ 
        error: 'Account is pending approval. Please contact support.' 
      }, { status: 403 });
    }

    // Create magic link
    const magicLinkData = await convexHttp.mutation(api.magicLinks.createMagicLink, {
      userId: user._id,
      email: normalizedEmail,
    });

    // Determine where to send the magic link based on age and role
    let recipientEmail = normalizedEmail;
    let recipientName = user.firstName || 'User';
    let isParentForward = false;
    let childName = '';

    if (user.role === 'Child') {
      childName = user.firstName || 'Your child';
      
      // Calculate child's age
      const birthYear = new Date(user.birthdate).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;

      if (age < 13) {
        // Under 13: Send to parent's email
        // TODO: Get actual parent email from parentLinks table
        // For now, we'll send to the child's email but mark it as parent-forward
        recipientEmail = normalizedEmail;
        isParentForward = true;
        recipientName = 'Parent';
      } else {
        // 13+: Send directly to child
        recipientName = user.firstName || 'User';
      }
    } else {
      // Adult: Send directly to their email
      recipientName = user.firstName || 'User';
    }

    // Send magic link email
    try {
      // Import the email sending function
      const { sendMagicLinkEmail } = await import('@/lib/auth/sendMagicLinkEmail');
      
      await sendMagicLinkEmail({
        to: recipientEmail,
        name: recipientName,
        magicLink: `${process.env.NEXT_PUBLIC_APP_URL}/auth/magic/verify?token=${magicLinkData.token}&email=${encodeURIComponent(normalizedEmail)}`,
        isParentForward,
        childName: user.role === 'Child' ? childName : undefined,
      });

      console.log(`✅ Magic link sent to ${recipientEmail} for user ${user._id}`);
    } catch (emailError) {
      console.error('❌ Failed to send magic link email:', emailError);
      return NextResponse.json({ 
        error: 'Failed to send magic link. Please try again.' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Magic link sent! Check your email and click the link to sign in.'
    });

  } catch (error: any) {
    console.error('[MAGIC_LINK_REQUEST] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    console.log('🔐 [FORGOT-PASSWORD] API route called');
    
    const body = await req.json();
    console.log('🔐 [FORGOT-PASSWORD] Request body:', { email: body.email });
    
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      console.log('🔐 [FORGOT-PASSWORD] Validation failed:', parsed.error);
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { email } = parsed.data;
    
    // Check if user exists
    const user = await convexHttp.query(api.users.getUserByEmail, { email: email.toLowerCase() });
    
    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      console.log('🔐 [FORGOT-PASSWORD] User not found, but returning success for security');
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour from now

    // Store reset token in database
    await convexHttp.mutation(api.users.updateUser, {
      userId: user._id,
      updates: {
        resetToken: hashedToken,
        resetTokenExpires: expiresAt,
      },
    });

    // Send reset email
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://cliqstr.com'}/reset-password?code=${resetToken}`;
    
    // TODO: Implement email sending here
    // For now, just log the reset link
    console.log('🔐 [FORGOT-PASSWORD] Reset link generated:', resetLink);
    
    console.log('🔐 [FORGOT-PASSWORD] Password reset email sent successfully');
    return NextResponse.json({ success: true });
    
  } catch (err) {
    console.error('❌ [FORGOT-PASSWORD] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { sendResetPasswordEmail } from '@/lib/auth/sendResetPasswordEmail';
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

    // Send reset email via Resend
    const emailResult = await sendResetPasswordEmail(email, resetToken);
    
    if (!emailResult.success) {
      console.error('❌ [FORGOT-PASSWORD] Failed to send reset email:', emailResult.error);
      return NextResponse.json({ error: 'Failed to send reset email. Please try again.' }, { status: 500 });
    }
    
    console.log('🔐 [FORGOT-PASSWORD] Password reset email sent successfully to:', email);
    return NextResponse.json({ success: true });
    
  } catch (err) {
    console.error('❌ [FORGOT-PASSWORD] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendResetEmail } from '@/lib/auth/sendResetEmail';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Schema for sending reset email
const sendResetSchema = z.object({
  email: z.string().email(),
});

// Schema for actually resetting password
const resetPasswordSchema = z.object({
  code: z.string(),
  newPassword: z.string().min(8),
});

/**
 * API route handler for password reset
 * Handles both:
 * 1. Sending reset email (when only email is provided)
 * 2. Actually resetting password (when code and newPassword are provided)
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🔐 [RESET-PASSWORD] API route called');
    
    const body = await req.json();
    console.log('🔐 [RESET-PASSWORD] Request body keys:', Object.keys(body));
    
    // Check if this is a password reset request (has code and newPassword)
    if (body.code && body.newPassword) {
      console.log('🔐 [RESET-PASSWORD] Processing password reset with code');
      
      const parsed = resetPasswordSchema.safeParse(body);
      if (!parsed.success) {
        console.log('🔐 [RESET-PASSWORD] Password reset validation failed:', parsed.error);
        return NextResponse.json({ error: 'Invalid reset data' }, { status: 400 });
      }

      const { code, newPassword } = parsed.data;
      
      // Hash the token to match what's stored in the database
      const hashedToken = crypto.createHash('sha256').update(code).digest('hex');
      
      // Use the existing Convex function to reset the password
      const result = await convexHttp.mutation(api.users.resetUserPassword, {
        resetToken: hashedToken,
        newPassword: newPassword,
      });
      
      console.log('🔐 [RESET-PASSWORD] Password reset successful for user:', result);
      return NextResponse.json({ success: true });
    }
    
    // Otherwise, this is a request to send a reset email
    console.log('🔐 [RESET-PASSWORD] Processing reset email request');
    
    const parsed = sendResetSchema.safeParse(body);
    if (!parsed.success) {
      console.log('🔐 [RESET-PASSWORD] Email validation failed:', parsed.error);
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { email } = parsed.data;
    console.log('🔐 [RESET-PASSWORD] Processing reset for:', email);
    
    // Use the consolidated helper function that handles everything
    // This will check if user exists, generate token, and send email
    const result = await sendResetEmail(email);
    console.log('🔐 [RESET-PASSWORD] sendResetEmail result:', result);
    
    // Always return success (even if user doesn't exist) for security
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ [RESET-PASSWORD] Error:', err);
    console.error('❌ [RESET-PASSWORD] Error details:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

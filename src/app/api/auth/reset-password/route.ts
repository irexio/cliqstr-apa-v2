import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const resetPasswordSchema = z.object({
  code: z.string(),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    console.log('🔐 [RESET-PASSWORD] API route called');
    
    const body = await req.json();
    console.log('🔐 [RESET-PASSWORD] Request body keys:', Object.keys(body));
    
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      console.log('🔐 [RESET-PASSWORD] Validation failed:', parsed.error);
      return NextResponse.json({ error: 'Invalid reset data' }, { status: 400 });
    }

    const { code, newPassword } = parsed.data;
    
    // Hash the token to match what's stored in the database
    const hashedToken = crypto.createHash('sha256').update(code).digest('hex');
    console.log('🔐 [RESET-PASSWORD] Hashed token:', hashedToken.substring(0, 16) + '...');
    
    // Check if token exists and is not expired
    const user = await convexHttp.query(api.users.getUserByResetToken, { 
      token: hashedToken 
    });
    
    if (!user) {
      console.log('🔐 [RESET-PASSWORD] Token not found or expired');
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Hash the new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and clear reset token
    await convexHttp.mutation(api.users.updateUser, {
      userId: user._id,
      updates: {
        password: hashedPassword,
        resetToken: undefined,
        resetTokenExpires: undefined,
      },
    });
    
    console.log('🔐 [RESET-PASSWORD] Password reset successful for user:', user.email);
    return NextResponse.json({ success: true });
    
  } catch (err) {
    console.error('❌ [RESET-PASSWORD] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

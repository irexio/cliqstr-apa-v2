import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * API route to validate a password reset token
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Missing reset code' }, { status: 400 });
    }

    console.log('🔐 [VALIDATE-RESET-TOKEN] Validating token:', code.substring(0, 8) + '...');
    console.log('🔐 [VALIDATE-RESET-TOKEN] Full token length:', code.length);

    // Hash the token to match what's stored in the database
    const hashedToken = crypto.createHash('sha256').update(code).digest('hex');
    console.log('🔐 [VALIDATE-RESET-TOKEN] Hashed token:', hashedToken.substring(0, 16) + '...');

    // Check if token exists and is not expired
    const user = await convexHttp.query(api.users.getUserByResetToken, {
      token: hashedToken,
    });

    if (!user) {
      console.log('🔐 [VALIDATE-RESET-TOKEN] Invalid or expired token - no user found');
      console.log('🔐 [VALIDATE-RESET-TOKEN] Searched for hashed token:', hashedToken.substring(0, 16) + '...');
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    console.log('🔐 [VALIDATE-RESET-TOKEN] Token is valid for user:', user.email);
    return NextResponse.json({ success: true, email: user.email });

  } catch (err) {
    console.error('❌ [VALIDATE-RESET-TOKEN] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

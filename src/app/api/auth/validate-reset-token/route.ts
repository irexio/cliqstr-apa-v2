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
    console.log('🔐 [VALIDATE-RESET-TOKEN] Raw token (first 16 chars):', code.substring(0, 16));

    // Hash the token to match what's stored in the database
    const hashedToken = crypto.createHash('sha256').update(code).digest('hex');
    console.log('🔐 [VALIDATE-RESET-TOKEN] Hashed token:', hashedToken.substring(0, 16) + '...');
    console.log('🔐 [VALIDATE-RESET-TOKEN] Full hashed token:', hashedToken);

    // Check if token exists and is not expired
    console.log('🔐 [VALIDATE-RESET-TOKEN] Querying Convex for user with token...');
    let user;
    try {
      user = await convexHttp.query(api.users.getUserByResetToken, {
        token: hashedToken,
      });
      console.log('🔐 [VALIDATE-RESET-TOKEN] Convex query result:', user ? 'User found' : 'No user found');
    } catch (convexError) {
      console.error('❌ [VALIDATE-RESET-TOKEN] Convex query failed:', convexError);
      return NextResponse.json({ 
        error: 'Database query failed',
        details: convexError instanceof Error ? convexError.message : 'Unknown Convex error'
      }, { status: 500 });
    }

    if (!user) {
      console.log('🔐 [VALIDATE-RESET-TOKEN] Invalid or expired token - no user found');
      console.log('🔐 [VALIDATE-RESET-TOKEN] Searched for hashed token:', hashedToken.substring(0, 16) + '...');
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    console.log('🔐 [VALIDATE-RESET-TOKEN] Token is valid for user:', user.email);
    return NextResponse.json({ success: true, email: user.email });

  } catch (err) {
    console.error('❌ [VALIDATE-RESET-TOKEN] Error:', err);
    console.error('❌ [VALIDATE-RESET-TOKEN] Error details:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined
    });
    return NextResponse.json({ 
      error: 'Server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

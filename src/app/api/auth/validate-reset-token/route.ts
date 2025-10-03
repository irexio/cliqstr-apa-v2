import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const validateTokenSchema = z.object({
  code: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    console.log('🔐 [VALIDATE-RESET-TOKEN] API route called');
    
    const body = await req.json();
    console.log('🔐 [VALIDATE-RESET-TOKEN] Request body keys:', Object.keys(body));
    
    const parsed = validateTokenSchema.safeParse(body);
    if (!parsed.success) {
      console.log('🔐 [VALIDATE-RESET-TOKEN] Validation failed:', parsed.error);
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }

    const { code } = parsed.data;
    
    // Hash the token to match what's stored in the database
    const hashedToken = crypto.createHash('sha256').update(code).digest('hex');
    console.log('🔐 [VALIDATE-RESET-TOKEN] Hashed token:', hashedToken.substring(0, 16) + '...');
    
    // Check if token exists and is not expired
    const user = await convexHttp.query(api.users.getUserByResetToken, { 
      token: hashedToken 
    });
    
    if (!user) {
      console.log('🔐 [VALIDATE-RESET-TOKEN] Token not found or expired');
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    console.log('🔐 [VALIDATE-RESET-TOKEN] Token is valid for user:', user.email);
    return NextResponse.json({ success: true, userId: user._id });
    
  } catch (err) {
    console.error('❌ [VALIDATE-RESET-TOKEN] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

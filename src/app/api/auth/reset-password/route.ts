import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendResetEmail } from '@/lib/auth/sendResetEmail';

export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email(),
});

/**
 * API route handler for initiating password reset
 * Uses the consolidated sendResetEmail helper from lib/auth
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🔐 [RESET-PASSWORD] API route called');
    
    const body = await req.json();
    console.log('🔐 [RESET-PASSWORD] Request body:', { email: body.email });
    
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      console.log('🔐 [RESET-PASSWORD] Validation failed:', parsed.error);
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

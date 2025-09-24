import { NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/auth/sendVerificationEmail';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export const dynamic = 'force-dynamic';

/**
 * API route for resending verification emails
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }
    
    console.log('📧 [RESEND-VERIFICATION] Resending verification email to:', email);
    
    // Find the user by email
    const user = await convexHttp.query(api.users.getUserByEmail, { email });
    
    if (!user) {
      // For security, don't reveal if user exists or not
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists with this email, a verification email has been sent.'
      });
    }
    
    // Check if user is already verified
    if (user.isVerified) {
      return NextResponse.json({ 
        success: true,
        message: 'This account is already verified.'
      });
    }
    
    // Get user account for name
    const account = await convexHttp.query(api.accounts.getAccountByUserId, { userId: user._id });
    const name = account?.firstName || email.split('@')[0];
    
    // Send verification email
    const result = await sendVerificationEmail({
      to: email,
      userId: user._id,
      name: name
    });
    
    if (!result.success) {
      console.error('❌ [RESEND-VERIFICATION] Failed to send email:', result.error);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to send verification email'
      }, { status: 500 });
    }
    
    console.log('✅ [RESEND-VERIFICATION] Verification email sent successfully');
    return NextResponse.json({ 
      success: true,
      message: 'Verification email sent successfully'
    });
    
  } catch (error) {
    console.error('❌ [RESEND-VERIFICATION] Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to resend verification email'
    }, { status: 500 });
  }
}

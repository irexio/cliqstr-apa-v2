import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    console.log('🔐 [CHANGE-PASSWORD] API route called');
    
    // Get current user
    const user = await getCurrentUser();
    if (!user?.id) {
      console.log('🔐 [CHANGE-PASSWORD] No authenticated user');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    console.log('🔐 [CHANGE-PASSWORD] Request body keys:', Object.keys(body));
    
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      console.log('🔐 [CHANGE-PASSWORD] Validation failed:', parsed.error);
      return NextResponse.json({ error: 'Invalid password data' }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;
    
    // Get user from database to verify current password
    const userData = await convexHttp.query(api.users.getUserForSignIn, { email: user.email });
    if (!userData) {
      console.log('🔐 [CHANGE-PASSWORD] User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);
    if (!isCurrentPasswordValid) {
      console.log('🔐 [CHANGE-PASSWORD] Current password is incorrect');
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
    }
    if (!/(?=.*[a-z])/.test(newPassword)) {
      return NextResponse.json({ error: 'New password must contain at least one lowercase letter' }, { status: 400 });
    }
    if (!/(?=.*[A-Z])/.test(newPassword)) {
      return NextResponse.json({ error: 'New password must contain at least one uppercase letter' }, { status: 400 });
    }
    if (!/(?=.*\d)/.test(newPassword)) {
      return NextResponse.json({ error: 'New password must contain at least one number' }, { status: 400 });
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, userData.password);
    if (isSamePassword) {
      return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password in database
    await convexHttp.mutation(api.users.updateUser, {
      userId: user.id as any,
      updates: {
        password: hashedNewPassword,
      },
    });
    
    console.log('🔐 [CHANGE-PASSWORD] Password updated successfully for user:', user.email);
    return NextResponse.json({ success: true });
    
  } catch (err) {
    console.error('❌ [CHANGE-PASSWORD] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
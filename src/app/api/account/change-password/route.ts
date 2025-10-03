import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

export async function POST(req: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user?.id || !user.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;
    
    // Get user from database to verify current password
    const userData = await convexHttp.query(api.users.getUserForSignIn, { email: user.email });
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password in Convex
    await convexHttp.mutation(api.users.updateUser, {
      userId: user.id as any,
      updates: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
    
  } catch (err) {
    console.error('❌ [CHANGE-PASSWORD] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
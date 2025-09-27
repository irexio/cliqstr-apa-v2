import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export const dynamic = 'force-dynamic';

/**
 * API route to check if a user exists by email
 * Used during invite flow to determine if user needs authentication
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    console.log('🔍 [CHECK-USER] Checking if user exists:', email);

    // Check if user exists
    const user = await convexHttp.query(api.users.getUserByEmail, { email });

    const exists = !!user;
    console.log('🔍 [CHECK-USER] User exists:', exists);

    // Return whether user exists (don't expose user details for security)
    return NextResponse.json({ exists });

  } catch (err) {
    console.error('❌ [CHECK-USER] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

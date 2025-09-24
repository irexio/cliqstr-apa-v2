export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { invalidateUser } from '@/lib/cache/userCache';

/**
 * API Route for signing out users
 * Clears auth_token cookie and any other session data
 */
export async function POST(req: Request) {
  try {
    // Get the session first to access userId for cache invalidation
    const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionOptions);
    const userId = session.userId;
    
    // Create response object
    const response = NextResponse.json({ 
      success: true, 
      message: 'Successfully signed out' 
    });
    
    // Clear user cache to prevent cross-contamination
    if (userId) {
      console.log('[SIGN-OUT] Clearing user cache for userId:', userId);
      await invalidateUser(userId);
    }
    
    // Destroy the encrypted session
    await session.destroy();
    
    return response;
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to sign out' 
      },
      { status: 500 }
    );
  }
}

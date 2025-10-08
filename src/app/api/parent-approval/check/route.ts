import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/parent-approval/check?token=ABC123
 * 
 * Checks if a parent approval token is valid and returns the pending signup data
 */
export async function GET(req: NextRequest) {
  console.log('[PARENT-APPROVAL-CHECK] Route called!');
  
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    console.log(`[PARENT-APPROVAL-CHECK] URL: ${req.url}`);
    console.log(`[PARENT-APPROVAL-CHECK] Token from URL: ${token}`);

    if (!token) {
      console.log('[PARENT-APPROVAL-CHECK] No token provided');
      return NextResponse.json({ error: 'No approval token provided' }, { status: 400 });
    }

    console.log(`[PARENT-APPROVAL-CHECK] Checking token: ${token}`);

    // For now, just return a simple response to test if the route works
    return NextResponse.json({
      success: true,
      message: 'Route is working!',
      token: token,
    });

  } catch (error) {
    console.error('[PARENT-APPROVAL-CHECK] Error checking approval token:', error);
    return NextResponse.json({ 
      error: 'Failed to verify approval token' 
    }, { status: 500 });
  }
}

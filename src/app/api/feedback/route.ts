import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const feedbackSchema = z.object({
  category: z.enum(['Bug', 'Idea', 'General Comment']),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
});

/**
 * POST /api/feedback
 * 
 * Submit user feedback with category and message
 * Stores in Convex and sends email notification to admin
 */
export async function POST(req: NextRequest) {
  try {
    // Get user session
    const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.errors[0]?.message || 'Invalid feedback data' 
      }, { status: 400 });
    }

    const { category, message } = parsed.data;

    // Get user data for context
    const userData = await convexHttp.query(api.users.getCurrentUser, {
      userId: session.userId as any, // Type assertion for session userId
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Store feedback in Convex
    const feedbackId = await convexHttp.mutation(api.feedback.createFeedback, {
      userId: session.userId as any, // Type assertion for session userId
      userEmail: userData.email,
      category,
      message,
    });

    console.log(`✅ Feedback submitted: ${feedbackId} by ${userData.email}`);

    // Send email notification to admin
    try {
      const { sendFeedbackEmail } = await import('@/lib/email/sendFeedbackEmail');
      
      await sendFeedbackEmail({
        feedbackId,
        userEmail: userData.email,
        userName: userData.account?.firstName ? 
          `${userData.account.firstName} ${userData.account.lastName || ''}`.trim() : 
          userData.email.split('@')[0],
        category,
        message,
        submittedAt: new Date().toISOString(),
      });

      console.log(`📧 Feedback email sent for ${feedbackId}`);
    } catch (emailError) {
      console.error('❌ Failed to send feedback email:', emailError);
      // Don't fail the request if email fails - feedback is still stored
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      feedbackId 
    });

  } catch (error: any) {
    console.error('[FEEDBACK] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to submit feedback. Please try again.' 
    }, { status: 500 });
  }
}

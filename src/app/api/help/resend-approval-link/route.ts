import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { sendParentApprovalEmail } from '@/lib/auth/sendParentApprovalEmail';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'email_required' },
        { status: 400 }
      );
    }

    const emailNorm = email.toLowerCase().trim();

    // Find all pending parentApprovals for this email
    const approvals = await convexHttp.query(api.parentApprovals.getApprovalsByEmail, {
      email: emailNorm,
    });

    if (!approvals || approvals.length === 0) {
      // Don't reveal whether email exists for security
      return NextResponse.json({
        success: true,
        message: 'If an approval exists for this email, a recovery link has been sent.',
      });
    }

    // Find the most recent pending approval
    const pendingApproval = approvals.find(
      (a: any) => a.status === 'pending' && Date.now() < a.expiresAt
    );

    if (!pendingApproval) {
      // No valid pending approval
      return NextResponse.json({
        success: true,
        message: 'If an approval exists for this email, a recovery link has been sent.',
      });
    }

    // Send recovery email with resume link
    const resumeLink = `${BASE_URL}/parent-approval/resume?approvalId=${pendingApproval._id}`;
    const childFullName = `${pendingApproval.childFirstName} ${pendingApproval.childLastName}`;

    const html = `
      <div style="font-family:Poppins,Arial,sans-serif;background:#ffffff;margin:0;padding:40px 0;color:#000;">
        <div style="max-width:600px;margin:0 auto;padding:0 20px;">
          <div style="text-align:center;margin-bottom:32px;">
            <img src="${BASE_URL}/MASTERLOGO-BLACK.png" alt="Cliqstr" style="height:40px;" />
          </div>

          <h2 style="font-size:24px;font-weight:600;margin:24px 0 12px;color:#000;">Resume Setting Up ${childFullName}</h2>
          <p style="margin:12px 0;line-height:1.6;color:#333;">
            It looks like you started setting up ${childFullName} on Cliqstr but didn't finish. No worries — you can pick up where you left off.
          </p>

          <div style="text-align:center;margin-top:32px;">
            <a href="${resumeLink}" style="background:#000;color:#fff;padding:14px 28px;border-radius:9999px;font-weight:600;text-decoration:none;display:inline-block;">
              Resume Setup
            </a>
          </div>

          <p style="margin-top:20px;font-size:13px;color:#666;line-height:1.6;">
            If you already have a Cliqstr account, you can also log in directly and continue from where you left off.
          </p>

          <hr style="border:0;border-top:1px solid #eee;margin:32px 0 16px;" />
          <p style="font-size:12px;color:#666;margin:0;">
            This recovery link expires in 7 days. If you didn't request this, you can safely ignore it.
          </p>
        </div>
      </div>
    `;

    await sendParentApprovalEmail({
      to: emailNorm,
      childName: childFullName,
      childAge: 0, // Age not stored in approval record during recovery - use placeholder
      approvalCode: pendingApproval.approvalToken,
      subject: `Continue Setting Up ${childFullName} on Cliqstr`,
      html,
    });

    return NextResponse.json({
      success: true,
      message: 'Recovery link sent. Check your email to continue.',
    });
  } catch (error: any) {
    console.error('[RESEND_APPROVAL_LINK] Error:', error);
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500 }
    );
  }
}

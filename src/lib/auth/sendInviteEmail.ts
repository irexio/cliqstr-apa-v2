// 🔐 APA-SAFE — Centralized Invite Email Sender

import { sendEmail, BASE_URL } from '@/lib/email';

export async function sendInviteEmail({
  to,
  cliqName,
  inviterName,
  inviteLink,
  inviteCode,
  inviteNote,
}: {
  to: string;
  cliqName: string;
  inviterName: string;
  inviteLink: string;
  inviteCode: string;
  inviteNote?: string;
}) {
  // Extra detailed logging for debugging
  console.log(`📨 [sendInviteEmail] STARTING - Sending invite to: ${to}`);
  console.log(`[EMAIL DEBUG] Invite details: cliq=${cliqName}, inviter=${inviterName}`);
  console.log(`[EMAIL DEBUG] Using invite link: ${inviteLink}`);
  
  // Validate required parameters
  if (!to || !cliqName || !inviterName || !inviteLink || !inviteCode) {
    console.error(`❌ [sendInviteEmail] Missing required parameters:`, { to, cliqName, inviterName, inviteLink, inviteCode });
    return { success: false, error: 'Missing required parameters for invite email' };
  }
  
  const declineLink = `${BASE_URL}/api/invite/decline?code=${encodeURIComponent(inviteCode)}`;
  const subject = `${inviterName} invited you to ${cliqName} — join?`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;max-width:600px;margin:0 auto;background:#ffffff;padding:32px 20px;color:#333;">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 12px;">Join ${inviterName}'s Cliq: ${cliqName}</h1>
      ${inviteNote ? `<blockquote style="margin:0 0 12px;padding-left:12px;border-left:3px solid #ddd;color:#555;">${inviteNote}</blockquote>` : ''}
      <p style="margin:0 0 16px;color:#555;">Cliqstr is a simple, invite‑only space — no ads, no strangers. You'll choose a plan (free test plan available) and be ready in minutes.</p>
      <div style="text-align:center;margin:20px 0 8px;">
        <a href="${inviteLink}" style="display:inline-block;padding:12px 20px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Accept Invite</a>
      </div>
      <div style="text-align:center;margin-top:10px;">
        <a href="${inviteLink}" style="color:#111;text-decoration:underline;font-size:14px;">Open invite</a>
        <span style="color:#aaa;margin:0 8px;">·</span>
        <a href="${declineLink}" style="color:#666;text-decoration:underline;font-size:14px;">Decline</a>
      </div>
      <div style="margin:16px 0;padding:10px 12px;background:#f8f9fa;border:1px solid #e9ecef;border-radius:6px;">
        <p style="margin:0 0 6px;color:#333;font-weight:600;">Cliq Code: <span style="font-family:monospace;background:#fff;padding:2px 6px;border-radius:3px;">${inviteCode}</span></p>
        <p style="margin:0;color:#666;font-size:13px;">Or visit cliqstr.com/invite/manual and enter this code.</p>
      </div>
      <div style="margin-top:20px;text-align:center;color:#888;font-size:12px;">
        <p style="margin:0;">No ads. No public feeds. Your people only.</p>
      </div>
      <!-- Support Link -->
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #eee;text-align:center;">
        <p style="font-size:12px;color:#666;margin:0;">Having trouble with your invite?</p>
        <p style="font-size:12px;margin:6px 0 0;">
          <a href="${BASE_URL}/invite/manual" style="color:#000;text-decoration:underline;font-weight:600;">📝 Enter code manually</a>
          &nbsp;•&nbsp;
          <a href="mailto:support@cliqstr.com" style="color:#000;text-decoration:underline;font-weight:600;">📧 Get help</a>
        </p>
      </div>
      <!-- 🔧 Unique identifier to prevent MailChannels duplicate-content bounces
           When multiple invites are sent to the same recipient in quick succession,
           email providers like MailChannels use content fingerprinting to detect spam.
           This invisible comment ensures each email has a unique hash, preventing false
           positives for legitimate sequential invites. Users never see this. -->
      <!-- unique:${Date.now()}-${Math.random().toString(36).substr(2, 9)} -->
    </div>
  `;

  console.log(`[EMAIL DEBUG] Attempting to send email to ${to} with subject "${subject}"`);
  
  try {
    const result = await sendEmail({
      to,
      subject,
      html
    });
    
    if (!result.success) {
      console.error(`❌ [sendInviteEmail] Failed to send invite email to ${to}:`, result.error);
      return result;
    }
    
    console.log(`✅ [sendInviteEmail] Successfully sent invite email to ${to} with messageId: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`❌ [sendInviteEmail] Exception while sending invite email to ${to}:`, error);
    return { success: false, error };
  }
}

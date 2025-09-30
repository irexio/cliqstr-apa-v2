// 🔐 APA-SAFE — Centralized Invite Email Sender

import { sendEmail, BASE_URL } from '@/lib/email';

export async function sendInviteEmail({
  to,
  cliqName,
  inviterName,
  inviteLink,
  inviteCode,
}: {
  to: string;
  cliqName: string;
  inviterName: string;
  inviteLink: string;
  inviteCode: string;
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
  
  // Improved subject line with inviter's real name
  const subject = `${inviterName} invited you to join ${cliqName} on Cliqstr!`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; font-size: 16px;">
      <h2 style="margin: 0 0 8px; font-size: 24px;">${inviterName} has invited you to join their cliq on <strong>Cliqstr</strong>.</h2>
      <p style="margin: 0 0 16px; color: #555;">Group: <strong>${cliqName}</strong></p>
      <p><strong>${inviterName}</strong> thinks you'd love it.</p>
      <p>
        Cliqstr is a safe, private space for families, kids, and trusted groups.
        No ads. No tracking. Just your people.
      </p>
      <div style="margin: 30px 0;">
        <a href="${inviteLink}" style="display:inline-block; padding:16px 32px; background:#000000; color:white; border-radius:8px; text-decoration:none; font-weight: 600; font-size: 18px;">
          Accept Invite
        </a>
      </div>
      
      <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 5px;">
        <p style="margin: 0 0 8px; font-weight: bold; color: #333;">Your Cliq Code: <span style="font-family: monospace; background: #fff; padding: 2px 6px; border-radius: 3px;">${inviteCode}</span></p>
        <p style="margin: 0; font-size: 16px; color: #666;">Joining from another device? Visit <a href="https://cliqstr.com/invite/manual" style="color: #000;">cliqstr.com/invite/manual</a> and enter this code.</p>
      </div>
      
      <p style="font-size: 16px; color: #888;">This invite link is valid for 36 hours.</p>
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

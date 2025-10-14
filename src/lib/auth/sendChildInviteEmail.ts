/**
 * 🔐 APA-HARDENED — Child Invite Email Sender
 * 
 * This utility sends invite emails to parents/guardians of children
 * who have been invited to join a cliq.
 * 
 * The email is sent to the trusted adult contact and includes:
 * - Who invited the child (inviter name)
 * - The child's first name
 * - The cliq they're being invited to
 * - A personalized note (optional)
 * - A link to accept the invite
 * 
 * Security notes:
 * - All child accounts must be created by a parent/guardian
 * - The invite link leads to a page that requires adult verification
 * - Detailed logging for audit trail
 */

import { sendEmail, BASE_URL } from '@/lib/email';

interface ChildInviteEmailParams {
  to: string;               // Trusted adult's email
  cliqName: string;         // Name of the cliq
  inviterName: string;      // Name of the person sending the invite
  inviteLink: string;       // Link to accept the invite
  friendFirstName: string;  // Child's first name
  friendLastName?: string;  // Child's last name
  inviteNote?: string;      // Optional message to the parent
  inviteCode: string;       // Invite code for manual entry
  parentAccountExists?: boolean; // Whether parent already has account
}

export async function sendChildInviteEmail({
  to,
  cliqName,
  inviterName,
  inviteLink,
  friendFirstName,
  friendLastName = '',
  inviteNote,
  inviteCode,
  parentAccountExists = false
}: ChildInviteEmailParams) {
  const childFullName = friendLastName ? `${friendFirstName} ${friendLastName}` : friendFirstName;
  console.log(`[CHILD_INVITE_EMAIL] Sending invite for ${childFullName} to ${to}`);
  
  const declineLink = `${BASE_URL}/api/invite/decline?code=${encodeURIComponent(inviteCode)}`;
  const subject = `${inviterName} invited ${childFullName} to ${cliqName} — approve?`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;max-width:600px;margin:0 auto;background:#ffffff;padding:32px 20px;color:#333;">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 12px;">${inviterName} invited ${childFullName}</h1>
      <p style="margin:0 0 16px;color:#555;">They’d like ${childFullName} to join their private Cliq “${cliqName}” on Cliqstr.</p>
      <p style="margin:0 0 16px;color:#555;">Cliqstr is a safer, invite‑only space. Before ${childFullName} can join, your approval is required.</p>
      <div style="text-align:center;margin:20px 0 8px;">
        <a href="${inviteLink}" style="display:inline-block;padding:12px 20px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Approve & Continue</a>
      </div>
      <p style="margin:8px 0 16px;text-align:center;color:#666;font-size:13px;">${parentAccountExists ? 'You’ll review and confirm in Parent HQ.' : 'You’ll create a quick Parent account, then confirm in Parent HQ.'}</p>
      ${inviteNote ? `<div style="background:#f8f9fa;border-left:4px solid #000;padding:12px 14px;margin:16px 0;"><p style=\"margin:0;color:#333;\"><strong>Note from ${inviterName}:</strong> ${inviteNote}</p></div>` : ''}
      <div style="text-align:center;margin-top:8px;">
        <a href="${inviteLink}" style="color:#111;text-decoration:underline;font-size:14px;">Open invite</a>
        <span style="color:#aaa;margin:0 8px;">·</span>
        <a href="${declineLink}" style="color:#666;text-decoration:underline;font-size:14px;">Decline</a>
      </div>
      <div style="margin-top:28px;text-align:center;color:#888;font-size:12px;">
        <p style="margin:0;">No ads. No strangers. You stay in control.</p>
      </div>
    </div>
  `;

  try {
    const result = await sendEmail({ to, subject, html });

    if (result.success) {
      console.log(`[CHILD_INVITE_EMAIL] Successfully sent invite for ${friendFirstName} to ${to}`);
      return { success: true, messageId: result.messageId };
    } else {
      console.error(`[CHILD_INVITE_EMAIL] Failed to send invite:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`[CHILD_INVITE_EMAIL] Exception:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

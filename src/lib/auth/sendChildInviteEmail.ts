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
  const subject = `Your child ${childFullName} was invited to a private Cliq on Cliqstr`;

  // Render HTML using the provided copy (no new deps)
  const logoSrc = `${BASE_URL}/MASTERLOGO-BLACK.png`;
  const learnMoreLink = `${BASE_URL}/for-parents`;
  const preheader = 'Review and approve — private, ad-free, no DMs.';

  const html = `
    <div style="font-family:Poppins,Arial,sans-serif;background:#ffffff;margin:0;padding:40px 0;color:#000;">
      <!-- Preheader -->
      <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">${preheader}</div>
      <div style="max-width:600px;margin:0 auto;padding:0 20px;">
        <!-- Logo -->
        <div style="text-align:center;margin-bottom:32px;">
          <img src="${logoSrc}" alt="Cliqstr" width="200" style="display:inline-block;" />
        </div>

        <!-- Intro -->
        <p style="font-size:18px;font-weight:600;margin:0 0 8px;">Your child ${childFullName} was invited to join a private Cliq on Cliqstr</p>
        <p style="margin:12px 0;line-height:1.6;">
          ${inviterName} invited your child <strong>${childFullName}</strong> to join <strong>${cliqName}</strong> on <strong>Cliqstr</strong> — a private, ad‑free social platform for families and trusted friends.
        </p>
        <p style="margin:12px 0;line-height:1.6;">
          The cliq in this invite is <strong>private and moderated</strong>, with verified connections and parent involvement. Cliqstr also has <strong>no private messages (DMs)</strong>; all communication happens in group spaces you can see.
        </p>

        <!-- Why -->
        <p style="font-weight:600;font-size:16px;margin:24px 0 6px;">Why parents choose Cliqstr</p>
        <ul style="margin:6px 0 0 20px;padding:0;line-height:1.6;">
          <li>No ads or strangers — every member is verified.</li>
          <li>No private messages (DMs); conversations happen in group spaces.</li>
          <li>Parents can see what their child is invited to and posts.</li>
          <li>Built-in AI monitoring and Red Alerts for safety.</li>
          <li>Optional Silent Monitoring for quiet oversight.</li>
        </ul>

        <!-- Steps -->
        <p style="font-weight:600;font-size:16px;margin:24px 0 6px;">Before your child can join</p>
        <ol style="margin:6px 0 0 20px;padding:0;line-height:1.6;">
          <li>Create your account (or sign in).</li>
          <li>Confirm your identity with a credit card <span style="color:#555;">(verification only — includes a free 30‑day trial)</span>.</li>
          <li>Set up your child's permissions in the Parents HQ Dashboard.</li>
        </ol>

        <!-- CTA -->
        <div style="text-align:center;margin-top:32px;">
          <a href="${inviteLink}" style="background:#000;color:#fff;padding:14px 28px;border-radius:9999px;font-weight:600;text-decoration:none;display:inline-block;">Approve Invite</a>
        </div>

        <!-- Secondary Links -->
        <div style="text-align:center;margin-top:16px;">
          <a href="${declineLink}" style="font-size:14px;text-decoration:underline;margin-right:12px;color:#000;">Decline</a>
          <a href="${learnMoreLink}" style="font-size:14px;text-decoration:underline;color:#000;">Learn how Cliqstr keeps families safe</a>
        </div>

        <!-- Footer -->
        <hr style="border:0;border-top:1px solid #eee;margin:32px 0 16px;" />
        <p style="font-size:13px;color:#555;line-height:1.6;">
          If you weren't expecting this, you can safely decline. No account will be created for your child without verified parent approval.
          <br /><br />
          Built for families and friends — not followers.
        </p>
        ${inviteNote ? `<div style="background:#f8f9fa;border-left:4px solid #000;padding:12px 14px;margin:16px 0;"><p style=\"margin:0;color:#333;\"><strong>Note from ${inviterName}:</strong> ${inviteNote}</p></div>` : ''}
        
        <!-- Support Link -->
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #eee;">
          <p style="font-size:12px;color:#666;margin:0;">Having trouble with your invite?</p>
          <p style="font-size:12px;margin:6px 0 0;">
            <a href="${BASE_URL}/invite/manual" style="color:#000;text-decoration:underline;font-weight:600;">📝 Enter code manually</a>
            &nbsp;•&nbsp;
            <a href="mailto:support@cliqstr.com" style="color:#000;text-decoration:underline;font-weight:600;">📧 Get help</a>
          </p>
        </div>
      </div>
      <!-- 🔧 Unique identifier to prevent MailChannels duplicate-content bounces
           When multiple child invites are sent to the same parent in quick succession,
           email providers like MailChannels use content fingerprinting to detect spam.
           This invisible comment ensures each email has a unique hash, preventing false
           positives for legitimate sequential invites. Users never see this. -->
      <!-- unique:${Date.now()}-${Math.random().toString(36).substr(2, 9)} -->
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

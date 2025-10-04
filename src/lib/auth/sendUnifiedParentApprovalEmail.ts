'use server';

import { sendEmail, BASE_URL } from '@/lib/email';

type SendUnifiedParentApprovalEmailParams = {
  to: string;
  childName: string;
  context: 'direct_signup' | 'child_invite';
  approvalToken: string;
  // Optional fields for child invite context
  inviterName?: string;
  cliqName?: string;
  // Optional fields for customization
  subject?: string;
  html?: string;
};

export async function sendUnifiedParentApprovalEmail({
  to,
  childName,
  context,
  approvalToken,
  inviterName,
  cliqName,
  subject,
  html,
}: SendUnifiedParentApprovalEmailParams) {
  console.log(`📨 [sendUnifiedParentApprovalEmail] Sending ${context} approval email to: ${to} for child: ${childName}`);
  
  // Build approval URL - link to smart router that detects progress
  const approvalLink = `${BASE_URL}/parent-approval/smart?token=${encodeURIComponent(approvalToken)}`;
  
  console.log(`🔗 [sendUnifiedParentApprovalEmail] Generated approval link: ${approvalLink}`);

  // Generate context-specific content
  let defaultSubject: string;
  let emailContent: string;

  if (context === 'direct_signup') {
    defaultSubject = `Your child wants to join Cliqstr - Parent Approval Required`;
    emailContent = `
      <p>Your child <strong>${childName}</strong> is signing up for Cliqstr, a safe and private space to connect with close family and friends.</p>
      <p>To approve their account and set up parental controls, please click the button below:</p>
    `;
  } else if (context === 'child_invite') {
    defaultSubject = `${inviterName} invited your child ${childName} to join their Cliq on Cliqstr - Your approval is required`;
    emailContent = `
      <p><strong>${inviterName}</strong> has invited your child <strong>${childName}</strong> to join their private Cliq "${cliqName}" on Cliqstr.</p>
      <p>We know our parent approval process is more involved than most social platforms — and that's intentional. Every step is designed to keep your child and all Cliqstr members safe.</p>
      <p>Private Cliqs are small, invitation-only groups — like digital circles of trust — where members can connect safely, without ads, strangers, or pressure.</p>
      <div style="background: #f8f9fa; border-left: 4px solid #000; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; color: #333; font-weight: 600; font-size: 16px;">🔐 Before ${childName} can join, your approval is required.</p>
      </div>
      <p>To approve their account and set up parental controls, please click the button below:</p>
    `;
  } else {
    throw new Error(`Invalid context: ${context}`);
  }

  const defaultHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; background: white; padding: 40px 20px;">
      
      <h1 style="color: #333; font-size: 24px; margin-bottom: 20px; font-weight: 600;">Hi there,</h1>
      
      ${emailContent}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${approvalLink}" style="display:inline-block; padding:12px 24px; background:#000000; color:white; border-radius:5px; text-decoration:none; font-weight: bold; font-size: 16px;">
          Approve ${childName}'s Account
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666;"><strong>This link will expire in 3 days.</strong></p>
      <p style="font-size: 12px; color: #888;">If you did not request this, you can safely ignore it.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 12px; color: #888;">
        Questions about Cliqstr? Visit our website or contact support.<br>
        This email was sent because ${context === 'direct_signup' ? 'your child requested to join Cliqstr' : 'your child was invited to join a Cliq on Cliqstr'}.
      </p>
    </div>
  `;

  const result = await sendEmail({
    to,
    subject: subject || defaultSubject,
    html: html || defaultHtml,
  });
  
  if (!result.success) {
    console.error(`❌ [sendUnifiedParentApprovalEmail] Failed to send ${context} approval email to ${to}:`, result.error);
  }
  
  return result;
}

'use server';

import { sendEmail, BASE_URL } from '@/lib/email';

type SendParentEmailParams = {
  to: string;
  childName: string;
  childId: string;
  inviteCode?: string;
  joinCode?: string;
  subject?: string;
  html?: string;
};

export async function sendParentEmail({
  to,
  childName,
  childId,
  inviteCode,
  joinCode,
  subject,
  html,
}: SendParentEmailParams) {
  console.log(`📨 [sendParentEmail] Sending parent approval email to: ${to} for child: ${childName}`);
  
  const defaultSubject = 'Approve Your Child\'s Cliqstr Account';

  // Build canonical invite URL pointing to smart router
  function buildParentInviteUrl(code?: string) {
    return code
      ? `${BASE_URL}/parent-approval/smart?token=${encodeURIComponent(code)}`
      : `${BASE_URL}/parents/hq`;
  }

  const approvalLink = buildParentInviteUrl(inviteCode);
  
  console.log(`🔗 [sendParentEmail] Generated approval link: ${approvalLink}`);
  console.log(`🔗 [sendParentEmail] BASE_URL: ${BASE_URL}`);
  console.log(`🔗 [sendParentEmail] inviteCode: ${inviteCode}`);

  const defaultHtml = `
    <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <h2>Parent Approval Required</h2>
      <p>Hello!</p>
      <p>Your child <strong>${childName}</strong> is signing up for Cliqstr, a safe and private space to connect with close family and friends.</p>
      <p>To approve their account and set up parental controls, please click the button below:</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${approvalLink}" style="display:inline-block; padding:12px 24px; background:#000000; color:white; border-radius:5px; text-decoration:none; font-weight: bold; font-size: 16px;">
          Approve ${childName}'s Account
        </a>
      </div>
      ${joinCode ? `<p style="margin: 20px 0; text-align: center; font-size: 14px; color: #666;">
        Or manually enter this code at cliqstr.com: 
        <strong style="font-family: monospace; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 16px;">${joinCode}</strong>
      </p>` : ''}
      <p style="font-size: 14px; color: #666;"><strong>This link will expire in 3 days.</strong></p>
      <p style="font-size: 12px; color: #888;">If you did not request this, you can safely ignore it.</p>
    </div>
  `;

  const result = await sendEmail({
    to,
    subject: subject || defaultSubject,
    html: html || defaultHtml,
  });
  
  if (!result.success) {
    console.error(`❌ [sendParentEmail] Failed to send parent approval email to ${to}:`, result.error);
  }
  
  return result;
}

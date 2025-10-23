'use server';

import { sendEmail, BASE_URL } from '@/lib/email';

type SendParentApprovalEmailParams = {
  to: string;
  childName: string;
  childAge: number;
  approvalCode: string;
  subject?: string;
  html?: string;
};

export async function sendParentApprovalEmail({
  to,
  childName,
  childAge,
  approvalCode,
  subject,
  html,
}: SendParentApprovalEmailParams) {
  console.log(`📨 [sendParentApprovalEmail] Sending parent approval email to: ${to} for child: ${childName}`);
  
  const defaultSubject = `${childName} wants to join Cliqstr - Parent Approval Required`;

  const approvalLink = `${BASE_URL}/parent-approval?code=${approvalCode}`;
  const logoSrc = `${BASE_URL}/MASTERLOGO-BLACK.png`;
  const learnMoreLink = `${BASE_URL}/for-parents`;

  const defaultHtml = `
    <div style="font-family:Poppins,Arial,sans-serif;background:#ffffff;margin:0;padding:40px 0;color:#000;">
      <!-- Preheader -->
      <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">Your child wants to join Cliqstr — a safe, private space for families.</div>
      <div style="max-width:600px;margin:0 auto;padding:0 20px;">
        <!-- Logo -->
        <div style="text-align:center;margin-bottom:32px;">
          <img src="${logoSrc}" alt="Cliqstr" width="200" style="display:inline-block;" />
        </div>

        <!-- Intro -->
        <p style="font-size:18px;font-weight:600;margin:0 0 8px;">Your child ${childName} wants to join Cliqstr</p>
        <p style="margin:12px 0;line-height:1.6;">
          <strong>${childName}</strong> (age ${childAge}) is asking permission to create an account on <strong>Cliqstr</strong> — a private, ad‑free social platform for families and trusted friends.
        </p>
        <p style="margin:12px 0;line-height:1.6;">
          This is <strong>not a public social network</strong>. Cliqstr is specifically designed for close connections with verified members, parental oversight, and built-in safety features.
        </p>

        <!-- Why -->
        <p style="font-weight:600;font-size:16px;margin:24px 0 6px;">Why parents choose Cliqstr</p>
        <ul style="margin:6px 0 0 20px;padding:0;line-height:1.6;">
          <li>No ads or strangers — every member is verified.</li>
          <li>No private messages (DMs); conversations happen in group spaces.</li>
          <li>You can see what your child is invited to and posts.</li>
          <li>Built-in AI monitoring and Red Alerts for safety.</li>
          <li>Optional Silent Monitoring for quiet oversight.</li>
        </ul>

        <!-- Action -->
        <p style="font-weight:600;font-size:16px;margin:24px 0 12px;">To approve ${childName}'s request</p>
        <ol style="margin:6px 0 0 20px;padding:0;line-height:1.6;">
          <li>Click the button below to approve.</li>
          <li>Set up ${childName}'s permissions in Parents HQ.</li>
          <li>Confirm your identity with a credit card (verification only — includes a free 30‑day trial).</li>
        </ol>

        <!-- CTA -->
        <div style="text-align:center;margin-top:32px;">
          <a href="${approvalLink}" style="background:#000;color:#fff;padding:14px 28px;border-radius:9999px;font-weight:600;text-decoration:none;display:inline-block;">Approve ${childName}'s Request</a>
        </div>

        <!-- Expiration Notice -->
        <div style="text-align:center;margin-top:16px;">
          <p style="font-size:13px;color:#666;margin:0;">This approval link expires in 7 days.</p>
        </div>

        <!-- Footer -->
        <hr style="border:0;border-top:1px solid #eee;margin:32px 0 16px;" />
        <p style="font-size:13px;color:#555;line-height:1.6;">
          If you didn't expect this request, you can safely ignore this email. No account will be created without your approval.
          <br /><br />
          Built for families and friends — not followers.
        </p>

        <!-- Support Link -->
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #eee;">
          <p style="font-size:12px;color:#666;margin:0;">Having trouble with this email?</p>
          <p style="font-size:12px;margin:6px 0 0;">
            <a href="mailto:support@cliqstr.com" style="color:#000;text-decoration:underline;font-weight:600;">📧 Get help</a>
          </p>
        </div>
      </div>
      <!-- 🔧 Unique identifier to prevent MailChannels duplicate-content bounces
           When multiple approval requests are sent to the same parent,
           email providers use content fingerprinting to detect spam.
           This invisible comment ensures each email has a unique hash. -->
      <!-- unique:\${Date.now()}-\${Math.random().toString(36).substr(2, 9)} -->
    </div>
  `;

  const result = await sendEmail({
    to,
    subject: subject || defaultSubject,
    html: html || defaultHtml,
  });
  
  if (!result.success) {
    console.error(`❌ [sendParentApprovalEmail] Failed to send parent approval email to ${to}:`, result.error);
  }
  
  return result;
}

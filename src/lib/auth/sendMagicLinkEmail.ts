import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendMagicLinkEmailProps {
  to: string;
  name: string;
  magicLink: string;
  isParentForward?: boolean;
  childName?: string;
}

/**
 * ⚡ Send Magic Link Email
 * 
 * Sends a passwordless authentication link via email
 * Supports age-based routing for children
 */
export async function sendMagicLinkEmail({
  to,
  name,
  magicLink,
  isParentForward = false,
  childName,
}: SendMagicLinkEmailProps) {
  try {
  const subject = isParentForward 
    ? `Your child ${childName || 'Your child'} forgot their password - Cliqstr`
    : 'Your Magic Link - Cliqstr Login';

    const htmlContent = isParentForward 
      ? generateParentForwardEmailHTML(name, childName || 'Your child', magicLink)
      : generateDirectMagicLinkEmailHTML(name, magicLink);

    const { data, error } = await resend.emails.send({
      from: 'Cliqstr <noreply@email.cliqstr.com>',
      to: [to],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(`Failed to send magic link email: ${error.message}`);
    }

    console.log(`✅ Magic link email sent to ${to}:`, data?.id);
    return data;
  } catch (error) {
    console.error('❌ Magic link email error:', error);
    throw error;
  }
}

/**
 * Generate HTML for direct magic link email (13+ children and adults)
 */
function generateDirectMagicLinkEmailHTML(name: string, magicLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Magic Link - Cliqstr</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; font-size: 16px; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000000; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .button { display: inline-block; background: #000000; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; font-size: 18px; }
        .button:hover { opacity: 0.9; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 16px; }
        .security-note { background: #f8f9fa; border-left: 4px solid #000000; padding: 16px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Magic Link is Ready!</h1>
          <p>Sign in to Cliqstr without a password</p>
        </div>
        
        <div class="content">
          <h2>Hi ${name}!</h2>
          
          <p>You requested a magic link to sign in to your Cliqstr account. Click the button below to sign in instantly - no password required!</p>
          
          <div style="text-align: center;">
            <a href="${magicLink}" class="button">Sign In with Magic Link</a>
          </div>
          
          <div class="security-note">
            <strong>Security Note:</strong> This link will expire in 15 minutes and can only be used once. If you didn't request this link, please ignore this email.
          </div>
          
          <p><strong>Having trouble?</strong> If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px;">${magicLink}</p>
        </div>
        
        <div class="footer">
          <p>This email was sent from Cliqstr. If you have any questions, please contact our support team.</p>
          <p>© 2024 Cliqstr. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML for parent-forwarded magic link email (under 13 children)
 */
function generateParentForwardEmailHTML(parentName: string, childName: string, magicLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Magic Link for ${childName} - Cliqstr</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; font-size: 16px; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000000; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .button { display: inline-block; background: #000000; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; font-size: 18px; }
        .button:hover { opacity: 0.9; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 16px; }
        .parent-note { background: #f8f9fa; border-left: 4px solid #000000; padding: 16px; margin: 20px 0; border-radius: 4px; }
        .security-note { background: #f8f9fa; border-left: 4px solid #000000; padding: 16px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset for ${childName}</h1>
          <p>Your child forgot their password</p>
        </div>
        
        <div class="content">
          <h2>Hi ${parentName}!</h2>
          
          <p>Your child ${childName} forgot their password and requested a magic link to sign in to their Cliqstr account. Since they're under 13, we're sending this link to you for safety.</p>
          
          <div class="parent-note">
            <strong>For Parents:</strong> Please share this magic link with your child so they can sign in. The link will work on any device and expires in 15 minutes.
            <br><br>
            <strong>Tip:</strong> If you're on a different computer than your child, you can copy the link below and send it to them via text, email, or any messaging app. They can then click it on their device to sign in.
          </div>
          
          <div style="text-align: center;">
            <a href="${magicLink}" class="button">Open Magic Link for ${childName}</a>
          </div>
          
          <div class="security-note">
            <strong>Security Note:</strong> This link will expire in 15 minutes and can only be used once. If your child didn't request this link, please ignore this email.
          </div>
          
          <p><strong>Having trouble?</strong> If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px;">${magicLink}</p>
        </div>
        
        <div class="footer">
          <p>This email was sent from Cliqstr. If you have any questions, please contact our support team.</p>
          <p>© 2024 Cliqstr. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

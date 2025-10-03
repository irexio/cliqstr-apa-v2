import { sendEmail, BASE_URL } from '@/lib/email';

/**
 * Send password reset email with secure reset link
 */
export async function sendResetPasswordEmail(email: string, resetToken: string): Promise<{ success: boolean; error?: any }> {
  try {
    const resetLink = `${BASE_URL}/reset-password?code=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - Cliqstr</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background-color: #000000; padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">cliqstr</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px 24px;">
              <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">Reset Your Password</h2>
              
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                You requested to reset your password for your Cliqstr account. Click the button below to set a new password:
              </p>
              
              <!-- Reset Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 8px 0 0 0; word-break: break-all;">
                <a href="${resetLink}" style="color: #6b7280;">${resetLink}</a>
              </p>
              
              <div style="margin-top: 32px; padding: 16px; background-color: #f3f4f6; border-radius: 6px;">
                <p style="color: #374151; font-size: 14px; line-height: 20px; margin: 0 0 8px 0; font-weight: 500;">Important Security Information:</p>
                <ul style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0; padding-left: 20px;">
                  <li>This link will expire in 1 hour for security</li>
                  <li>If you didn't request this reset, you can safely ignore this email</li>
                  <li>Your password will not be changed until you click the link and set a new one</li>
                </ul>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0;">
                This email was sent from Cliqstr. If you have any questions, please contact us at 
                <a href="mailto:support@cliqstr.com" style="color: #6b7280;">support@cliqstr.com</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await sendEmail({
      to: email,
      subject: 'Reset Your Password - Cliqstr',
      html,
    });

    if (result.success) {
      console.log('✅ [RESET-PASSWORD-EMAIL] Email sent successfully to:', email);
      return { success: true };
    } else {
      console.error('❌ [RESET-PASSWORD-EMAIL] Failed to send email:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ [RESET-PASSWORD-EMAIL] Exception sending email:', error);
    return { success: false, error };
  }
}

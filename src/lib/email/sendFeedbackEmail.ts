import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendFeedbackEmailProps {
  feedbackId: string;
  userEmail: string;
  userName: string;
  category: 'Bug' | 'Idea' | 'General Comment';
  message: string;
  submittedAt: string;
}

export async function sendFeedbackEmail({
  feedbackId,
  userEmail,
  userName,
  category,
  message,
  submittedAt,
}: SendFeedbackEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Cliqstr Support <support@cliqstr.com>',
      to: ['support@cliqstr.com'], // Admin email
      subject: `New ${category} Feedback from ${userName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Feedback - Cliqstr</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
            }
            .header {
              background-color: #000000;
              color: #ffffff;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #ffffff;
              padding: 30px;
              border: 1px solid #e5e5e5;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .feedback-details {
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .category-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .category-bug { background-color: #fee2e2; color: #dc2626; }
            .category-idea { background-color: #dbeafe; color: #2563eb; }
            .category-general { background-color: #f3f4f6; color: #374151; }
            .message-box {
              background-color: #ffffff;
              border: 1px solid #e5e5e5;
              border-radius: 8px;
              padding: 16px;
              margin: 16px 0;
              white-space: pre-wrap;
              font-family: monospace;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e5e5;
              color: #666;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              background-color: #000000;
              color: #ffffff;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">⚡ New Feedback</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Cliqstr Support</p>
          </div>
          
          <div class="content">
            <h2 style="margin-top: 0;">Feedback Details</h2>
            
            <div class="feedback-details">
              <p><strong>User:</strong> ${userName} (${userEmail})</p>
              <p><strong>Category:</strong> 
                <span class="category-badge category-${category.toLowerCase().replace(' ', '-')}">
                  ${category}
                </span>
              </p>
              <p><strong>Submitted:</strong> ${new Date(submittedAt).toLocaleString()}</p>
              <p><strong>Feedback ID:</strong> ${feedbackId}</p>
            </div>
            
            <h3>Message:</h3>
            <div class="message-box">${message}</div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://dashboard.convex.dev" class="button">
                View in Admin Dashboard
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>This feedback was submitted through the Cliqstr app.</p>
            <p>Reply directly to this email to respond to the user.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send feedback email: ${error.message}`);
    }

    console.log('✅ Feedback email sent successfully:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Error sending feedback email:', error);
    throw error;
  }
}

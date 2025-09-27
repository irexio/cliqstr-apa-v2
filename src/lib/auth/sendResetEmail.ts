import { convexHttp } from '@/lib/convex-server'
import { api } from 'convex/_generated/api'
import { sendEmail, BASE_URL } from '@/lib/email'
import crypto from 'crypto'

type SendResetEmailResponse = {
  success: boolean
  error?: string
  details?: any
  token?: string
  tokenExpires?: Date
}

export async function sendResetEmail(email: string): Promise<SendResetEmailResponse> {
  console.log('📨 [sendResetEmail] Invoked for:', email)

  try {
    const user = await convexHttp.query(api.users.getUserByEmail, { email })

    if (!user) {
      console.log('🚫 No user found:', email)
      return { success: true } // hide whether the user exists
    }

    // Get account info
    const account = await convexHttp.query(api.users.getCurrentUser, { userId: user._id })
    
    // ✅ Allow password reset even if not approved
    if (!account?.account?.isApproved) {
      console.log(`[🕊️] User not approved — allowing reset so they can complete signup: ${email}`)
    }

    const token = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const tokenExpires = new Date(Date.now() + 60 * 60 * 1000)

    await convexHttp.mutation(api.users.updateUser, {
      userId: user._id,
      updates: {
        resetToken: hashedToken,
        resetTokenExpires: tokenExpires.getTime(),
      },
    })

    const resetUrl = `${BASE_URL}/reset-password?code=${token}`
    console.log('🔗 Reset URL:', resetUrl)
    console.log('🔗 BASE_URL:', BASE_URL)
    console.log('🔗 Token (first 8 chars):', token.substring(0, 8) + '...')
    console.log('🔗 Token length:', token.length)

    const emailResult = await sendEmail({
      to: email,
      subject: 'Reset Your Cliqstr Password',
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>Hi there,</p>
          <p>You requested a password reset for your Cliqstr account.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${resetUrl}" style="display:inline-block; padding:12px 24px; background:#000000; color:white; border-radius:5px; text-decoration:none; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">This link will expire in 1 hour.</p>
          <p style="font-size: 12px; color: #888;">If you didn't request this, you can ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #888;">– The Cliqstr Team</p>
        </div>
      `,
    })

    if (!emailResult.success) {
      console.error('❌ Email sending failed:', emailResult.error)
      return {
        success: false,
        error: 'Email service failed: ' + (emailResult.error || 'Unknown error'),
        details: emailResult.error,
      }
    }

    console.log('✅ Email sent successfully with ID:', emailResult.messageId)

    return {
      success: true,
      token,
      tokenExpires,
    }
  } catch (err: any) {
    console.error('❌ sendResetEmail exception:', err)
    return {
      success: false,
      error: err.message || 'Unknown error',
      details: err,
    }
  }
}

/**
 * Email Verification Helper
 * 
 * Purpose:
 * - Sends a verification email to users as part of the sign-up flow
 * - Required for account activation (blocking verification)
 * - Helps ensure account recovery and valid email addresses
 * - Prevents fake accounts and improves security
 */

import { sendEmail, BASE_URL } from '@/lib/email';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import crypto from 'crypto';

interface SendVerificationEmailOptions {
  to: string;
  userId: string;
  name?: string;
}

export async function sendVerificationEmail({ to, userId, name }: SendVerificationEmailOptions) {
  try {
    const displayName = name || to.split('@')[0];

    // Add stack trace logging to debug why this is being called multiple times
    console.log(`📨 [sendVerificationEmail] Called for user: ${to} (${userId})`);
    console.log(`📨 [sendVerificationEmail] Stack trace:`, new Error().stack);

    // Generate a secure, random verification code (24 hour expiration)
    const code = [...Array(48)].map(() => Math.random().toString(36)[2]).join('');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    
    // Store hash and expiry in User model using Convex
    await convexHttp.mutation(api.users.updateUser, {
      userId: userId as any,
      updates: {
        verificationToken: codeHash,
        verificationExpires: expiresAt.getTime(),
      },
    });

    const verificationLink = `${BASE_URL}/verify-email?code=${code}`;

    console.log(`📨 [sendVerificationEmail] Sending verification email to: ${to}`);
    
    const result = await sendEmail({
      to,
      subject: 'Verify your Cliqstr account',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; font-size: 16px; line-height: 1.6;">
          <h2 style="color: #000; font-size: 24px;">Welcome to Cliqstr!</h2>
          <p>Hi ${displayName},</p>
          <p>Thanks for signing up! Please verify your email address to complete your account setup.</p>
          <p>This step is <strong>required</strong> to activate your account and continue to plan selection.</p>
          
          <div style="margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #000; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; display: inline-block;">
              Verify My Email
            </a>
          </div>
          
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account on Cliqstr, please ignore this email.</p>
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 16px;">© ${new Date().getFullYear()} Cliqstr - The private social platform for friends, family and safe online communities</p>
        </div>
      `
    });

    if (!result.success) {
      console.error(`❌ [sendVerificationEmail] Failed to send verification email to ${to}:`, result.error);
      return { 
        success: false, 
        message: 'Failed to send verification email',
        error: result.error
      };
    }
    
    return { 
      success: true, 
      messageId: result.messageId || 'unknown',
      message: 'Verification email sent successfully'
    };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { 
      success: false, 
      message: 'Failed to send verification email',
      error
    };
  }
}

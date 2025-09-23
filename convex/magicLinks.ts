import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * 🪄 Magic Links for Passwordless Authentication
 * 
 * Implements secure, time-limited, single-use magic links for user authentication.
 * Replaces password-based login with email-based magic links.
 */

/**
 * Create a new magic link for a user
 */
export const createMagicLink = mutation({
  args: {
    userId: v.id('users'),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + (15 * 60 * 1000); // 15 minutes from now
    
    // Generate a secure random token (using Math.random for Convex compatibility)
    const token = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    // Simple hash for Convex (in production, consider using a more secure approach)
    const tokenHash = token; // For now, store the token directly (in production, use proper hashing)
    
    // Store the magic link record
    const magicLinkId = await ctx.db.insert('magicLinks', {
      userId: args.userId,
      tokenHash,
      email: args.email.toLowerCase().trim(),
      expiresAt,
      createdAt: now,
    });
    
    // Return the unhashed token (only time it's returned)
    return {
      magicLinkId,
      token, // Return the raw token for the email
      expiresAt,
    };
  },
});

/**
 * Verify and consume a magic link token
 */
export const verifyMagicLink = mutation({
  args: {
    token: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // For now, use token directly (in production, implement proper hashing)
    const tokenHash = args.token;
    
    // Find the magic link
    const magicLink = await ctx.db
      .query('magicLinks')
      .withIndex('by_token_hash', (q) => q.eq('tokenHash', tokenHash))
      .filter((q) => q.eq(q.field('email'), args.email.toLowerCase().trim()))
      .first();
    
    if (!magicLink) {
      throw new Error('Invalid magic link');
    }
    
    // Check if already used
    if (magicLink.usedAt) {
      throw new Error('Magic link has already been used');
    }
    
    // Check if expired
    if (now > magicLink.expiresAt) {
      throw new Error('Magic link has expired');
    }
    
    // Mark as used
    await ctx.db.patch(magicLink._id, {
      usedAt: now,
    });
    
    // Get the user details
    const user = await ctx.db.get(magicLink.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get the account details
    const account = await ctx.db
      .query('accounts')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .first();
    
    if (!account) {
      throw new Error('Account not found');
    }
    
    return {
      userId: user._id,
      email: user.email,
      role: account.role,
      isApproved: account.isApproved,
    };
  },
});

/**
 * Get magic link by token hash (for verification)
 */
export const getMagicLinkByToken = query({
  args: {
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('magicLinks')
      .withIndex('by_token_hash', (q) => q.eq('tokenHash', args.tokenHash))
      .first();
  },
});

/**
 * Clean up expired magic links (can be called periodically)
 */
export const cleanupExpiredMagicLinks = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const expiredLinks = await ctx.db
      .query('magicLinks')
      .withIndex('by_expires_at', (q) => q.lt('expiresAt', now))
      .collect();
    
    for (const link of expiredLinks) {
      await ctx.db.delete(link._id);
    }
    
    return { deletedCount: expiredLinks.length };
  },
});

/**
 * Get user by email for magic link creation
 */
export const getUserByEmailForMagicLink = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase().trim()))
      .first();
    
    if (!user) {
      return null;
    }
    
    // Get the account details
    const account = await ctx.db
      .query('accounts')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .first();
    
    if (!account) {
      return null;
    }
    
    return {
      _id: user._id,
      email: user.email,
      birthdate: account.birthdate,
      role: account.role,
      approved: account.isApproved,
      firstName: account.firstName,
    };
  },
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get current user with profile and account info
export const getCurrentUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const profile = await ctx.db
      .query("myProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (account?.suspended) {
      return null; // Suspended users cannot access
    }

    return {
      id: user._id,
      email: user.email,
      isVerified: user.isVerified ?? false,
      plan: account?.plan ?? null,
      role: account?.role ?? null,
      approved: account?.isApproved ?? null,
      myProfile: profile ? {
        id: profile._id,
        username: profile.username,
        image: profile.image,
        bannerImage: profile.bannerImage,
        about: profile.about,
        birthdate: account?.birthdate, // Get birthdate from account (single source of truth)
        firstName: account?.firstName, // Get firstName from account (single source of truth)
        lastName: account?.lastName, // Get lastName from account (single source of truth)
        showYear: profile.showYear,
      } : null,
      account: account ? {
        role: account.role,
        isApproved: account.isApproved,
        stripeStatus: account.stripeStatus || null,
        plan: account.plan || null,
        stripeCustomerId: account.stripeCustomerId || null,
        suspended: account.suspended,
        birthdate: account.birthdate,
        firstName: account.firstName,
        lastName: account.lastName,
      } : null,
    };
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Get user by email or username (for sign-in)
export const getUserForSignIn = query({
  args: { email: v.optional(v.string()), username: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.email) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .first();
      
      if (user) {
        const profile = await ctx.db
          .query("myProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .first();
        
        const account = await ctx.db
          .query("accounts")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .first();
        
        return {
          ...user,
          myProfile: profile,
          account: account,
        };
      }
    }
    
    if (args.username) {
      const profile = await ctx.db
        .query("myProfiles")
        .withIndex("by_username", (q) => q.eq("username", args.username!))
        .first();
      
      if (profile) {
        const user = await ctx.db.get(profile.userId);
        const account = await ctx.db
          .query("accounts")
          .withIndex("by_user_id", (q) => q.eq("userId", profile.userId))
          .first();
        
        return user ? {
          ...user,
          myProfile: profile,
          account: account,
        } : null;
      }
    }
    
    return null;
  },
});

// Get child settings for a profile
export const getChildSettings = query({
  args: { profileId: v.id("myProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("childSettings")
      .withIndex("by_profile_id", (q) => q.eq("profileId", args.profileId))
      .first();
  },
});

// Verify user email
export const verifyUserEmail = mutation({
  args: { verificationToken: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_verification_token", (q) => q.eq("verificationToken", args.verificationToken))
      .filter((q) => q.gt(q.field("verificationExpires"), Date.now()))
      .first();

    if (!user) {
      throw new Error("Invalid or expired verification token");
    }

    await ctx.db.patch(user._id, {
      isVerified: true,
      verificationToken: undefined,
      verificationExpires: undefined,
    });

    return user._id;
  },
});

// Reset user password
export const resetUserPassword = mutation({
  args: { 
    resetToken: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_reset_token", (q) => q.eq("resetToken", args.resetToken))
      .filter((q) => q.gt(q.field("resetTokenExpires"), Date.now()))
      .first();

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    // Hash the new password (this should be done on the client side or in a secure environment)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(args.newPassword, 12);

    await ctx.db.patch(user._id, {
      password: hashedPassword,
      resetToken: undefined,
      resetTokenExpires: undefined,
    });

    return user._id;
  },
});

// Update user plan
export const updateUserPlan = mutation({
  args: { 
    userId: v.id("users"),
    plan: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!account) {
      throw new Error("Account not found");
    }

    await ctx.db.patch(account._id, {
      plan: args.plan,
    });

    return account._id;
  },
});

// Upgrade user to parent
export const upgradeToParent = mutation({
  args: { 
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!account) {
      throw new Error("Account not found");
    }

    if (account.role === "Parent") {
      throw new Error("Already a parent account");
    }

    if (account.role === "Child") {
      throw new Error("Child accounts cannot become parents");
    }

    await ctx.db.patch(account._id, {
      role: "Parent",
      isApproved: true, // Parents are auto-approved
    });

    return account._id;
  },
});

// Mark user as verified (idempotent)
export const markUserVerified = mutation({
  args: { 
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isVerified: true,
    });

    return args.userId;
  },
});

// Create new user
export const createUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    isParent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const userId = await ctx.db.insert("users", {
      email: args.email,
      password: args.password,
      createdAt: now,
      updatedAt: now,
      isVerified: false,
      isParent: args.isParent ?? false,
    });

    return userId;
  },
});

// Update user
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
      email: v.optional(v.string()),
      password: v.optional(v.string()),
      resetToken: v.optional(v.string()),
      resetTokenExpires: v.optional(v.number()),
      verificationToken: v.optional(v.string()),
      verificationExpires: v.optional(v.number()),
      isVerified: v.optional(v.boolean()),
      deletedAt: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});

// Get user by reset token
export const getUserByResetToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_reset_token", (q) => q.eq("resetToken", args.token))
      .filter((q) => q.gt(q.field("resetTokenExpires"), Date.now()))
      .first();
  },
});

// Get user by verification token
export const getUserByVerificationToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_verification_token", (q) => q.eq("verificationToken", args.token))
      .first();
  },
});


// Check if user exists by email
export const userExists = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return !!user;
  },
});

// Delete user
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
  },
});

// Create user with account and profile in transaction
export const createUserWithAccount = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    birthdate: v.number(),
    role: v.string(),
    isApproved: v.boolean(),
    plan: v.optional(v.string()),
    isVerified: v.optional(v.boolean()),
    verificationToken: v.optional(v.string()),
    verificationExpires: v.optional(v.number()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Create user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      password: args.password,
      createdAt: now,
      updatedAt: now,
      isVerified: args.isVerified ?? false,
      isParent: args.role === 'Parent',
      verificationToken: args.verificationToken,
      verificationExpires: args.verificationExpires,
    });

    // Create account
    await ctx.db.insert("accounts", {
      userId,
      birthdate: args.birthdate,
      role: args.role,
      isApproved: args.isApproved,
      plan: args.plan,
      stripeStatus: undefined,
      stripeCustomerId: undefined,
      suspended: false,
      createdAt: now,
      firstName: args.firstName,
      lastName: args.lastName,
    });

    // Auto-create profile with signup data to reduce friction
    if (args.firstName && args.lastName) {
      // Generate username from email (before @ symbol)
      const emailUsername = args.email.split('@')[0];
      
      // Compute birthday cache from birthdate
      const birthDate = new Date(args.birthdate);
      const month = String(birthDate.getMonth() + 1).padStart(2, '0');
      const day = String(birthDate.getDate()).padStart(2, '0');
      const birthdayMonthDay = `${month}-${day}`;
      
      // Enforce child policy: children can never show year
      const isMinor = (new Date().getFullYear() - birthDate.getFullYear()) < 18;
      const showYear = isMinor ? false : false; // Default to false for privacy
      
      await ctx.db.insert("myProfiles", {
        username: emailUsername,
        createdAt: now,
        updatedAt: now,
        userId,
        showYear: showYear,
        aiModerationLevel: "strict",
        showMonthDay: true, // Default: show birthday to cliq members
        birthdayMonthDay,
      });
    }

    return userId;
  },
});

// Admin function to promote a user to admin role
export const promoteToAdmin = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find their account
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .first();

    if (!account) {
      throw new Error("Account not found");
    }

    // Update account role to Admin
    await ctx.db.patch(account._id, {
      role: "Admin",
      isApproved: true,
    });

    return { success: true, userId: user._id, email: user.email };
  },
});

// Admin function to create a new admin account
export const createAdminAccount = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      password: args.password, // Note: This should be hashed in production
      createdAt: now,
      updatedAt: now,
      isVerified: true,
      isParent: false,
    });

    // Create admin account
    await ctx.db.insert("accounts", {
      userId,
      birthdate: new Date("1990-01-01").getTime(), // Default birthdate for admin
      role: "Admin",
      isApproved: true,
      plan: "admin",
      stripeStatus: undefined,
      stripeCustomerId: undefined,
      suspended: false,
      createdAt: now,
    });

    return { success: true, userId, email: args.email };
  },
});

// Admin functions for user management
export const getAllUsers = query({
  args: {
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const accounts = await ctx.db.query("accounts").collect();
    const profiles = await ctx.db.query("myProfiles").collect();
    
    // Join users with their accounts and profiles
    const usersWithData = users.map(user => {
      const account = accounts.find(acc => acc.userId === user._id);
      const profile = profiles.find(prof => prof.userId === user._id);
      
      return {
        id: user._id,
        email: user.email,
        createdAt: new Date(user.createdAt).toISOString(),
        account: account ? {
          id: account._id,
          role: account.role,
          plan: account.plan,
          isApproved: account.isApproved,
          suspended: account.suspended,
        } : null,
        myProfile: profile ? {
          id: profile._id,
          username: profile.username,
        } : null,
      };
    });
    
    // Filter by role if specified
    if (args.role) {
      return usersWithData.filter(user => user.account?.role === args.role);
    }
    
    return usersWithData;
  },
});

export const approveUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    if (account) {
      await ctx.db.patch(account._id, { isApproved: true });
    }
  },
});

export const deactivateUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    if (account) {
      await ctx.db.patch(account._id, { isApproved: false });
    }
  },
});

export const suspendUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    if (account) {
      await ctx.db.patch(account._id, { suspended: true });
    }
  },
});

export const unsuspendUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    if (account) {
      await ctx.db.patch(account._id, { suspended: false });
    }
  },
});

export const softDeleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { deletedAt: Date.now() });
  },
});

export const hardDeleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    console.log(`[COMPLIANCE_DELETE] Starting complete data deletion for user ${args.userId}`);
    
    // 1. Delete all posts by this user
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author_id", (q) => q.eq("authorId", args.userId))
      .collect();
    for (const post of posts) {
      await ctx.db.delete(post._id);
    }
    console.log(`[COMPLIANCE_DELETE] Deleted ${posts.length} posts`);
    
    // 2. Delete all replies by this user
    const replies = await ctx.db
      .query("replies")
      .withIndex("by_author_id", (q) => q.eq("authorId", args.userId))
      .collect();
    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }
    console.log(`[COMPLIANCE_DELETE] Deleted ${replies.length} replies`);
    
    // 3. Delete all invites created by this user
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_inviter_id", (q) => q.eq("inviterId", args.userId))
      .collect();
    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }
    console.log(`[COMPLIANCE_DELETE] Deleted ${invites.length} invites`);
    
    // 4. Delete all invite requests by this user
    const inviteRequests = await ctx.db
      .query("inviteRequests")
      .withIndex("by_inviter_id", (q) => q.eq("inviterId", args.userId))
      .collect();
    for (const request of inviteRequests) {
      await ctx.db.delete(request._id);
    }
    console.log(`[COMPLIANCE_DELETE] Deleted ${inviteRequests.length} invite requests`);
    
    // 5. Delete all parent links (both as parent and child)
    const parentLinksAsParent = await ctx.db
      .query("parentLinks")
      .withIndex("by_parent_id", (q) => q.eq("parentId", args.userId))
      .collect();
    for (const link of parentLinksAsParent) {
      await ctx.db.delete(link._id);
    }
    
    const parentLinksAsChild = await ctx.db
      .query("parentLinks")
      .withIndex("by_child_id", (q) => q.eq("childId", args.userId))
      .collect();
    for (const link of parentLinksAsChild) {
      await ctx.db.delete(link._id);
    }
    console.log(`[COMPLIANCE_DELETE] Deleted ${parentLinksAsParent.length + parentLinksAsChild.length} parent links`);
    
    // 6. Delete all parent audit logs
    const auditLogsAsParent = await ctx.db
      .query("parentAuditLogs")
      .withIndex("by_parent_id", (q) => q.eq("parentId", args.userId))
      .collect();
    for (const log of auditLogsAsParent) {
      await ctx.db.delete(log._id);
    }
    
    const auditLogsAsChild = await ctx.db
      .query("parentAuditLogs")
      .withIndex("by_child_id", (q) => q.eq("childId", args.userId))
      .collect();
    for (const log of auditLogsAsChild) {
      await ctx.db.delete(log._id);
    }
    console.log(`[COMPLIANCE_DELETE] Deleted ${auditLogsAsParent.length + auditLogsAsChild.length} audit logs`);
    
    // 7. Delete all memberships
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }
    console.log(`[COMPLIANCE_DELETE] Deleted ${memberships.length} memberships`);
    
    // 8. Delete all user activity logs
    const activityLogs = await ctx.db
      .query("userActivityLogs")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    for (const log of activityLogs) {
      await ctx.db.delete(log._id);
    }
    console.log(`[COMPLIANCE_DELETE] Deleted ${activityLogs.length} activity logs`);
    
    // 9. Delete profile and related data
    const profile = await ctx.db
      .query("myProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    if (profile) {
      // Delete child settings
      const childSettings = await ctx.db
        .query("childSettings")
        .withIndex("by_profile_id", (q) => q.eq("profileId", profile._id))
        .collect();
      for (const settings of childSettings) {
        await ctx.db.delete(settings._id);
      }
      
      // Delete scrapbook items
      const scrapbookItems = await ctx.db
        .query("scrapbookItems")
        .withIndex("by_profile_id", (q) => q.eq("profileId", profile._id))
        .collect();
      for (const item of scrapbookItems) {
        await ctx.db.delete(item._id);
      }
      
      await ctx.db.delete(profile._id);
      console.log(`[COMPLIANCE_DELETE] Deleted profile and ${childSettings.length} child settings, ${scrapbookItems.length} scrapbook items`);
    }
    
    // 10. Delete account
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    if (account) {
      await ctx.db.delete(account._id);
    }
    
    // 11. Finally, delete the user record
    await ctx.db.delete(args.userId);
    
    console.log(`[COMPLIANCE_DELETE] Complete data deletion finished for user ${args.userId}`);
  },
});

// Get data deletion summary for compliance transparency
export const getDataDeletionSummary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author_id", (q) => q.eq("authorId", args.userId))
      .collect();
    
    const replies = await ctx.db
      .query("replies")
      .withIndex("by_author_id", (q) => q.eq("authorId", args.userId))
      .collect();
    
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_inviter_id", (q) => q.eq("inviterId", args.userId))
      .collect();
    
    const inviteRequests = await ctx.db
      .query("inviteRequests")
      .withIndex("by_inviter_id", (q) => q.eq("inviterId", args.userId))
      .collect();
    
    const parentLinksAsParent = await ctx.db
      .query("parentLinks")
      .withIndex("by_parent_id", (q) => q.eq("parentId", args.userId))
      .collect();
    
    const parentLinksAsChild = await ctx.db
      .query("parentLinks")
      .withIndex("by_child_id", (q) => q.eq("childId", args.userId))
      .collect();
    
    const auditLogsAsParent = await ctx.db
      .query("parentAuditLogs")
      .withIndex("by_parent_id", (q) => q.eq("parentId", args.userId))
      .collect();
    
    const auditLogsAsChild = await ctx.db
      .query("parentAuditLogs")
      .withIndex("by_child_id", (q) => q.eq("childId", args.userId))
      .collect();
    
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    const activityLogs = await ctx.db
      .query("userActivityLogs")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    const profile = await ctx.db
      .query("myProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    let childSettings = 0;
    let scrapbookItems = 0;
    
    if (profile) {
      const childSettingsList = await ctx.db
        .query("childSettings")
        .withIndex("by_profile_id", (q) => q.eq("profileId", profile._id))
        .collect();
      childSettings = childSettingsList.length;
      
      const scrapbookItemsList = await ctx.db
        .query("scrapbookItems")
        .withIndex("by_profile_id", (q) => q.eq("profileId", profile._id))
        .collect();
      scrapbookItems = scrapbookItemsList.length;
    }
    
    return {
      user: 1,
      account: 1,
      profile: profile ? 1 : 0,
      posts: posts.length,
      replies: replies.length,
      invites: invites.length,
      inviteRequests: inviteRequests.length,
      parentLinks: parentLinksAsParent.length + parentLinksAsChild.length,
      auditLogs: auditLogsAsParent.length + auditLogsAsChild.length,
      memberships: memberships.length,
      activityLogs: activityLogs.length,
      childSettings,
      scrapbookItems,
      totalRecords: 1 + 1 + (profile ? 1 : 0) + posts.length + replies.length + 
                   invites.length + inviteRequests.length + 
                   (parentLinksAsParent.length + parentLinksAsChild.length) +
                   (auditLogsAsParent.length + auditLogsAsChild.length) +
                   memberships.length + activityLogs.length + childSettings + scrapbookItems
    };
  },
});

// Create child settings for a profile
export const createChildSettings = mutation({
  args: {
    profileId: v.id("myProfiles"),
    canSendInvites: v.optional(v.boolean()),
    inviteRequiresApproval: v.optional(v.boolean()),
    canCreatePublicCliqs: v.optional(v.boolean()),
    canPostImages: v.optional(v.boolean()),
    canJoinPublicCliqs: v.optional(v.boolean()),
    canInviteChildren: v.optional(v.boolean()),
    canInviteAdults: v.optional(v.boolean()),
    isSilentlyMonitored: v.optional(v.boolean()),
    aiModerationLevel: v.optional(v.string()),
    canAccessGames: v.optional(v.boolean()),
    canShareYouTube: v.optional(v.boolean()),
    visibilityLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const settingsId = await ctx.db.insert("childSettings", {
      profileId: args.profileId,
      canCreatePublicCliqs: args.canCreatePublicCliqs ?? false,
      canJoinPublicCliqs: args.canJoinPublicCliqs ?? false,
      canCreateCliqs: false, // 🔒 SECURITY: Children need explicit parent permission to create cliqs
      canSendInvites: args.canSendInvites ?? false,
      canInviteChildren: args.canInviteChildren ?? false,
      canInviteAdults: args.canInviteAdults ?? false,
      isSilentlyMonitored: args.isSilentlyMonitored ?? false,
      aiModerationLevel: args.aiModerationLevel,
      canAccessGames: args.canAccessGames ?? true,
      canPostImages: args.canPostImages ?? true,
      canShareYouTube: args.canShareYouTube ?? false,
      visibilityLevel: args.visibilityLevel,
      inviteRequiresApproval: args.inviteRequiresApproval ?? true,
    });

    return settingsId;
  },
});

// Get parent emails for a child (CRITICAL for child safety)
export const getParentEmailsForChild = query({
  args: { childId: v.id("users") },
  handler: async (ctx, args) => {
    const parentLinks = await ctx.db
      .query("parentLinks")
      .withIndex("by_child_id", (q) => q.eq("childId", args.childId))
      .collect();

    return parentLinks.map(link => link.email).filter((email): email is string => !!email);
  },
});

// Log user activity (for debugging and security)
export const logUserActivity = mutation({
  args: {
    userId: v.optional(v.id("users")),
    event: v.string(),
    detail: v.optional(v.string()),
    debugId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("userActivityLogs", {
      userId: args.userId,
      event: args.event,
      detail: args.detail,
      debugId: args.debugId,
      createdAt: Date.now(),
    });

    return logId;
  },
});
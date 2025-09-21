import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get profile by username
export const getProfileByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("myProfiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!profile) return null;

    const user = await ctx.db.get(profile.userId);
    
    // Get account data for birthdate (single source of truth)
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", profile.userId))
      .first();
    
    return {
      ...profile,
      user: user ? {
        id: user._id,
        email: user.email,
      } : null,
      // Include account data for birthdate and name access (single source of truth)
      account: account ? {
        birthdate: account.birthdate,
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role,
        isApproved: account.isApproved,
      } : null,
    };
  },
});

// Get profile by user ID
export const getProfileByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("myProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!profile) return null;
    
    // Get account data for birthdate (single source of truth)
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    return {
      ...profile,
      // Include account data for birthdate and name access (single source of truth)
      account: account ? {
        birthdate: account.birthdate,
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role,
        isApproved: account.isApproved,
      } : null,
    };
  },
});

// Create profile
export const createProfile = mutation({
  args: {
    userId: v.id("users"),
    username: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    about: v.optional(v.string()),
    image: v.optional(v.string()),
    bannerImage: v.optional(v.string()),
    showYear: v.optional(v.boolean()),
    ageGroup: v.optional(v.string()),
    aiModerationLevel: v.optional(v.union(v.literal("strict"), v.literal("moderate"), v.literal("relaxed"))),
    showMonthDay: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get account to compute birthday cache
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    // Compute birthday cache from accounts.birthdate
    let birthdayMonthDay: string | undefined;
    if (account?.birthdate) {
      const birthDate = new Date(account.birthdate);
      const month = String(birthDate.getMonth() + 1).padStart(2, '0');
      const day = String(birthDate.getDate()).padStart(2, '0');
      birthdayMonthDay = `${month}-${day}`;
    }
    
    // Enforce child policy: children can never show year
    const isMinor = account ? (new Date().getFullYear() - new Date(account.birthdate).getFullYear()) < 18 : false;
    const enforcedShowYear = isMinor ? false : (args.showYear ?? false);
    
    const profileId = await ctx.db.insert("myProfiles", {
      username: args.username,
      createdAt: now,
      updatedAt: now,
      userId: args.userId,
      firstName: args.firstName,
      lastName: args.lastName,
      about: args.about,
      image: args.image,
      bannerImage: args.bannerImage,
      showYear: enforcedShowYear, // Children: always false, Adults: can control
      ageGroup: args.ageGroup,
      aiModerationLevel: args.aiModerationLevel ?? "strict",
      showMonthDay: args.showMonthDay ?? true, // Default: show birthday to cliq members
      birthdayMonthDay,
    });

    return profileId;
  },
});

// Update profile
export const updateProfile = mutation({
  args: {
    profileId: v.id("myProfiles"),
    updates: v.object({
      username: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      about: v.optional(v.string()),
      image: v.optional(v.string()),
      bannerImage: v.optional(v.string()),
      showYear: v.optional(v.boolean()),
      aiModerationLevel: v.optional(v.union(v.literal("strict"), v.literal("moderate"), v.literal("relaxed"))),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});

// Update birthday visibility settings (enforces child policy)
export const updateBirthdayVisibility = mutation({
  args: {
    profileId: v.id("myProfiles"),
    showMonthDay: v.boolean(),
    showYear: v.boolean(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Profile not found");
    
    // Get account to check if user is minor
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", profile.userId))
      .first();
    
    if (!account) throw new Error("Account not found");
    
    // Enforce child policy: children can never show year
    const isMinor = (new Date().getFullYear() - new Date(account.birthdate).getFullYear()) < 18;
    const enforcedShowYear = isMinor ? false : args.showYear;
    
    await ctx.db.patch(args.profileId, {
      showMonthDay: args.showMonthDay,
      showYear: enforcedShowYear,
      updatedAt: Date.now(),
    });
  },
});

// Get all profiles (for debugging)
export const getAllProfiles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("myProfiles").collect();
  },
});

// Get profile with birthday information computed from accounts
export const getProfileWithBirthday = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("myProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!profile) return null;
    
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!account) return profile;
    
    // Compute birthday information from accounts.birthdate
    const birthDate = new Date(account.birthdate);
    const month = String(birthDate.getMonth() + 1).padStart(2, '0');
    const day = String(birthDate.getDate()).padStart(2, '0');
    const year = birthDate.getFullYear();
    
    return {
      ...profile,
      // Birthday information computed from accounts.birthdate
      birthdate: account.birthdate,
      birthdayMonthDay: `${month}-${day}`,
      birthdayYear: year,
      // Age computed from accounts.birthdate
      age: new Date().getFullYear() - year,
    };
  },
});

// Get profiles with birthdays today (for birthday notifications)
export const getTodaysBirthdays = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${month}-${day}`;
    
    const profiles = await ctx.db
      .query("myProfiles")
      .filter((q) => 
        q.and(
          q.eq(q.field("showMonthDay"), true),
          q.eq(q.field("birthdayMonthDay"), todayStr)
        )
      )
      .collect();
    
    return profiles;
  },
});

// Delete profile
export const deleteProfile = mutation({
  args: { profileId: v.id("myProfiles") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.profileId);
  },
});

// Check if users share any cliqs
export const checkSharedCliqMembership = query({
  args: {
    userId1: v.id("users"),
    userId2: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all cliqs for user1
    const user1Memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId1))
      .collect();

    const user1CliqIds = user1Memberships.map(m => m.cliqId);

    // Check if user2 is a member of any of user1's cliqs
    for (const cliqId of user1CliqIds) {
      const user2Membership = await ctx.db
        .query("memberships")
        .withIndex("by_user_cliq", (q) => 
          q.eq("userId", args.userId2).eq("cliqId", cliqId)
        )
        .first();

      if (user2Membership) {
        return true; // They share at least one cliq
      }
    }

    return false; // No shared cliqs
  },
});

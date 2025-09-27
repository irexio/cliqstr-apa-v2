import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Cleanup script to remove all test data from Convex
 * This will delete all users, accounts, profiles, cliqs, etc.
 * Use with caution - this is destructive!
 */
export const cleanupAllTestData = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🧹 Starting cleanup of all test data...");

    // Delete all scrapbook items
    const scrapbookItems = await ctx.db.query("scrapbookItems").collect();
    for (const item of scrapbookItems) {
      await ctx.db.delete(item._id);
    }
    console.log(`🗑️ Deleted ${scrapbookItems.length} scrapbook items`);

    // Delete all feedback
    const feedback = await ctx.db.query("feedback").collect();
    for (const item of feedback) {
      await ctx.db.delete(item._id);
    }
    console.log(`🗑️ Deleted ${feedback.length} feedback items`);

    // Delete all posts
    const posts = await ctx.db.query("posts").collect();
    for (const post of posts) {
      await ctx.db.delete(post._id);
    }
    console.log(`🗑️ Deleted ${posts.length} posts`);

    // Delete all replies
    const replies = await ctx.db.query("replies").collect();
    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }
    console.log(`🗑️ Deleted ${replies.length} replies`);

    // Delete all memberships
    const memberships = await ctx.db.query("memberships").collect();
    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }
    console.log(`🗑️ Deleted ${memberships.length} memberships`);

    // Delete all cliqs
    const cliqs = await ctx.db.query("cliqs").collect();
    for (const cliq of cliqs) {
      await ctx.db.delete(cliq._id);
    }
    console.log(`🗑️ Deleted ${cliqs.length} cliqs`);

    // Delete all invites
    const invites = await ctx.db.query("invites").collect();
    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }
    console.log(`🗑️ Deleted ${invites.length} invites`);

    // Delete all parent approvals
    const parentApprovals = await ctx.db.query("parentApprovals").collect();
    for (const approval of parentApprovals) {
      await ctx.db.delete(approval._id);
    }
    console.log(`🗑️ Deleted ${parentApprovals.length} parent approvals`);

    // Delete all profiles
    const profiles = await ctx.db.query("myProfiles").collect();
    for (const profile of profiles) {
      await ctx.db.delete(profile._id);
    }
    console.log(`🗑️ Deleted ${profiles.length} profiles`);

    // Delete all accounts
    const accounts = await ctx.db.query("accounts").collect();
    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }
    console.log(`🗑️ Deleted ${accounts.length} accounts`);

    // Delete all users
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }
    console.log(`🗑️ Deleted ${users.length} users`);

    console.log("✅ Cleanup complete! All test data has been removed.");
    return {
      success: true,
      deleted: {
        users: users.length,
        accounts: accounts.length,
        profiles: profiles.length,
        cliqs: cliqs.length,
        invites: invites.length,
        memberships: memberships.length,
        posts: posts.length,
        replies: replies.length,
        parentApprovals: parentApprovals.length,
        feedback: feedback.length,
        scrapbookItems: scrapbookItems.length,
      }
    };
  },
});

/**
 * Alternative: Clean up only specific test users (safer option)
 * You can specify email patterns to delete
 */
export const cleanupTestUsers = mutation({
  args: { 
    emailPatterns: v.array(v.string()) // e.g., ["test@", "robynpthomas+", "vmakaitis"]
  },
  handler: async (ctx, args) => {
    console.log("🧹 Starting cleanup of test users...");

    const allUsers = await ctx.db.query("users").collect();
    const usersToDelete = allUsers.filter(user => 
      args.emailPatterns.some(pattern => user.email.includes(pattern))
    );

    console.log(`Found ${usersToDelete.length} test users to delete`);

    for (const user of usersToDelete) {
      console.log(`Deleting user: ${user.email}`);
      
      // Delete related data first
      const account = await ctx.db.query("accounts").filter(q => q.eq(q.field("userId"), user._id)).first();
      if (account) {
        // Delete profile
        const profile = await ctx.db.query("myProfiles").filter(q => q.eq(q.field("userId"), user._id)).first();
        if (profile) {
          await ctx.db.delete(profile._id);
        }
        
        // Delete account
        await ctx.db.delete(account._id);
      }
      
      // Delete user
      await ctx.db.delete(user._id);
    }

    console.log(`✅ Deleted ${usersToDelete.length} test users and their related data.`);
    return {
      success: true,
      deletedUsers: usersToDelete.length,
      deletedEmails: usersToDelete.map(u => u.email)
    };
  },
});

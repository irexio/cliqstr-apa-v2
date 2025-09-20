import { mutation } from "./_generated/server";

// Migration: Move firstName/lastName from users to accounts table
// This ensures single source of truth for name data in accounts table
export const migrateNamesToAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    console.log('[MIGRATION] Starting firstName/lastName migration from users to accounts...');
    
    // Get all users that have firstName/lastName in users table
    const users = await ctx.db.query("users").collect();
    let migrated = 0;
    let skipped = 0;
    
    for (const user of users) {
      // Check if user has firstName/lastName in users table
      if (user.firstName || user.lastName) {
        // Find their account
        const account = await ctx.db
          .query("accounts")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .first();
        
        if (account) {
          // Check if account already has firstName/lastName
          if (!account.firstName && !account.lastName) {
            // Migrate the data
            await ctx.db.patch(account._id, {
              firstName: user.firstName,
              lastName: user.lastName,
            });
            
            console.log(`[MIGRATION] Migrated ${user.firstName} ${user.lastName} for user ${user.email}`);
            migrated++;
          } else {
            console.log(`[MIGRATION] Account already has name data for user ${user.email}, skipping`);
            skipped++;
          }
        } else {
          console.log(`[MIGRATION] No account found for user ${user.email}, skipping`);
          skipped++;
        }
      }
    }
    
    console.log(`[MIGRATION] Complete: ${migrated} migrated, ${skipped} skipped`);
    return { migrated, skipped, total: users.length };
  },
});

// Clean up: Remove firstName/lastName from users table after migration
export const cleanupUsersTable = mutation({
  args: {},
  handler: async (ctx) => {
    console.log('[CLEANUP] Removing firstName/lastName from users table...');
    
    const users = await ctx.db.query("users").collect();
    let cleaned = 0;
    
    for (const user of users) {
      if (user.firstName || user.lastName) {
        await ctx.db.patch(user._id, {
          firstName: undefined,
          lastName: undefined,
        });
        cleaned++;
      }
    }
    
    console.log(`[CLEANUP] Removed firstName/lastName from ${cleaned} user records`);
    return { cleaned, total: users.length };
  },
});

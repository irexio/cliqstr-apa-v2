import { mutation } from "./_generated/server";

/**
 * DEPRECATED MIGRATION FILE
 * 
 * These migrations were used to transition from storing firstName/lastName in the users table
 * to storing them ONLY in the accounts table (source of truth).
 * 
 * As of October 2025:
 * - The users.firstName and users.lastName schema fields have been removed
 * - All name data is now exclusively in accounts.firstName and accounts.lastName
 * - myProfiles.createProfile enforces APA by fetching names from accounts table
 * - These mutation functions are no longer needed and should not be called
 * 
 * If you're reading this and considering calling these mutations, DON'T:
 * - The schema no longer supports these fields
 * - Use the profiles.ts queries/mutations instead for name enforcement
 * 
 * See docs/SCHEMA-FIELD-GUIDE.md for current architecture
 */

// DEPRECATED: Migration is complete - DO NOT CALL
export const migrateNamesToAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    console.warn('[DEPRECATED] migrateNamesToAccounts has already been completed. This function is obsolete.');
    return { status: 'already_migrated', message: 'Migration is complete. All names are in accounts table.' };
  },
});

// DEPRECATED: Cleanup is complete - DO NOT CALL
export const cleanupUsersTable = mutation({
  args: {},
  handler: async (ctx) => {
    console.warn('[DEPRECATED] cleanupUsersTable has already been completed. This function is obsolete.');
    return { status: 'already_cleaned', message: 'Cleanup is complete. Users table no longer has name fields.' };
  },
});

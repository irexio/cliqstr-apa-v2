import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { MutationCtx } from "../_generated/server";

/**
 * Migration: Remove firstName and lastName fields from myProfiles table
 * This cleans up existing records that still have these fields after our schema change
 */
export const removeNameFields = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    console.log("Starting migration: Remove firstName/lastName from myProfiles");
    
    // Get all profiles
    const profiles = await ctx.db.query("myProfiles").collect();
    console.log(`Found ${profiles.length} profiles to check`);
    
    let updatedCount = 0;
    
    for (const profile of profiles) {
      // Check if the profile has the old fields
      const hasFirstName = 'firstName' in profile;
      const hasLastName = 'lastName' in profile;
      
      if (hasFirstName || hasLastName) {
        console.log(`Updating profile ${profile._id} - removing firstName/lastName fields`);
        console.log(`Profile data:`, { 
          username: profile.username, 
          hasFirstName, 
          hasLastName,
          firstName: (profile as any).firstName,
          lastName: (profile as any).lastName
        });
        
        // Create a new object without the firstName/lastName fields
        const { firstName, lastName, ...cleanProfile } = profile as any;
        
        // Replace the document with the cleaned version
        await ctx.db.replace(profile._id, cleanProfile);
        updatedCount++;
      }
    }
    
    console.log(`Migration complete: Updated ${updatedCount} profiles`);
    return { updatedCount, totalProfiles: profiles.length };
  },
});

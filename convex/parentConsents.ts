import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a parent consent record for a child
 * This is called when a parent approves a child account
 */
export const createParentConsent = mutation({
  args: {
    parentId: v.id("users"),
    childId: v.id("users"),
    redAlertAccepted: v.boolean(),
    silentMonitoringEnabled: v.boolean(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const consentId = await ctx.db.insert("parentConsents", {
      parentId: args.parentId,
      childId: args.childId,
      redAlertAccepted: args.redAlertAccepted,
      silentMonitoringEnabled: args.silentMonitoringEnabled,
      consentTimestamp: Date.now(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    console.log(`[PARENT_CONSENT] Created consent record ${consentId} for parent ${args.parentId} and child ${args.childId}`);
    
    return consentId;
  },
});

/**
 * Get parent consent for a specific child
 */
export const getParentConsent = query({
  args: {
    parentId: v.id("users"),
    childId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const consent = await ctx.db
      .query("parentConsents")
      .withIndex("by_parent_child", (q) => 
        q.eq("parentId", args.parentId).eq("childId", args.childId)
      )
      .first();

    return consent;
  },
});

/**
 * Get all consents for a parent
 */
export const getConsentsByParent = query({
  args: {
    parentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const consents = await ctx.db
      .query("parentConsents")
      .withIndex("by_parent_id", (q) => q.eq("parentId", args.parentId))
      .collect();

    return consents;
  },
});

/**
 * Get all consents for a child
 */
export const getConsentsByChild = query({
  args: {
    childId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const consents = await ctx.db
      .query("parentConsents")
      .withIndex("by_child_id", (q) => q.eq("childId", args.childId))
      .collect();

    return consents;
  },
});

/**
 * Update parent consent (for when parents change their consent)
 */
export const updateParentConsent = mutation({
  args: {
    parentId: v.id("users"),
    childId: v.id("users"),
    redAlertAccepted: v.optional(v.boolean()),
    silentMonitoringEnabled: v.optional(v.boolean()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingConsent = await ctx.db
      .query("parentConsents")
      .withIndex("by_parent_child", (q) => 
        q.eq("parentId", args.parentId).eq("childId", args.childId)
      )
      .first();

    if (!existingConsent) {
      throw new Error("Parent consent not found");
    }

    const updatedConsent = {
      redAlertAccepted: args.redAlertAccepted ?? existingConsent.redAlertAccepted,
      silentMonitoringEnabled: args.silentMonitoringEnabled ?? existingConsent.silentMonitoringEnabled,
      consentTimestamp: Date.now(),
      ipAddress: args.ipAddress ?? existingConsent.ipAddress,
      userAgent: args.userAgent ?? existingConsent.userAgent,
    };

    await ctx.db.patch(existingConsent._id, updatedConsent);

    console.log(`[PARENT_CONSENT] Updated consent for parent ${args.parentId} and child ${args.childId}`);
    
    return existingConsent._id;
  },
});

/**
 * Check if a child has valid parent consent
 * This is used to enforce compliance before allowing child interactions
 */
export const hasValidParentConsent = query({
  args: {
    childId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const consent = await ctx.db
      .query("parentConsents")
      .withIndex("by_child_id", (q) => q.eq("childId", args.childId))
      .first();

    if (!consent) {
      return {
        hasConsent: false,
        reason: "No parent consent found",
        consent: null,
      };
    }

    if (!consent.redAlertAccepted) {
      return {
        hasConsent: false,
        reason: "Red Alert agreement not accepted",
        consent,
      };
    }

    return {
      hasConsent: true,
      reason: "Valid consent found",
      consent,
    };
  },
});

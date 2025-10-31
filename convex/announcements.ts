import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if user is superadmin
 */
async function isSuperadmin(ctx: any, userId: Id<"users">): Promise<boolean> {
  const user = await ctx.db.get(userId);
  if (!user) return false;

  // Get superadmin email from environment (will be set in deployment)
  const superadminEmail = process.env.SUPERADMIN_EMAIL;
  return superadminEmail ? user.email === superadminEmail : false;
}

/**
 * Check if user owns a cliq
 */
async function isCliqOwner(
  ctx: any,
  userId: Id<"users">,
  cliqId: Id<"cliqs">
): Promise<boolean> {
  const cliq = await ctx.db.get(cliqId);
  if (!cliq) return false;

  return cliq.ownerId === userId;
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create announcement (global or cliq-specific)
 * Superadmin can create global announcements
 * Cliq owners can create cliq announcements
 */
export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    cliqId: v.optional(v.id("cliqs")),
    createdByUserId: v.id("users"),
    pinned: v.boolean(),
    visibility: v.union(v.literal("global"), v.literal("cliq")),
  },

  handler: async (ctx, args) => {
    const userId = args.createdByUserId;

    // Permission checks
    if (args.visibility === "global") {
      // Only superadmin can create global announcements
      const isAdmin = await isSuperadmin(ctx, userId);
      if (!isAdmin) throw new Error("Only superadmin can create global announcements");
    } else if (args.visibility === "cliq") {
      // Cliq owner must be creating for their cliq
      if (!args.cliqId) throw new Error("cliqId is required for cliq announcements");
      const isOwner = await isCliqOwner(ctx, userId, args.cliqId);
      if (!isOwner) throw new Error("Only cliq owner can create announcements for this cliq");
    }

    const now = Date.now();
    const expiresAt = args.pinned ? undefined : now + 14 * 24 * 60 * 60 * 1000; // 14 days

    const insertData: any = {
      title: args.title,
      message: args.message,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
      pinned: args.pinned,
      expiresAt,
      visibility: args.visibility,
    };

    // For cliq announcements, include cliqId (required)
    // For global announcements, omit cliqId (not needed)
    if (args.visibility === "cliq" && args.cliqId) {
      insertData.cliqId = args.cliqId;
    }

    const announcementId = await ctx.db.insert("announcements", insertData);

    return announcementId;
  },
});

/**
 * Update announcement (only creator or superadmin can edit)
 * Does NOT allow changing visibility - that's a delete + recreate operation
 */
export const updateAnnouncement = mutation({
  args: {
    id: v.id("announcements"),
    title: v.string(),
    message: v.string(),
    createdByUserId: v.id("users"),
    pinned: v.boolean(),
  },

  handler: async (ctx, args) => {
    const userId = args.createdByUserId;
    const announcement = await ctx.db.get(args.id);

    if (!announcement) throw new Error("Announcement not found");

    // Only creator or superadmin can update
    const isCreator = announcement.createdByUserId === userId;
    const isAdmin = await isSuperadmin(ctx, userId);

    if (!isCreator && !isAdmin) {
      throw new Error("Only creator or superadmin can update this announcement");
    }

    // Update the announcement (only title, message, and pinned status)
    // Visibility and cliqId cannot be changed
    const now = Date.now();

    // Build update object - always include basic fields
    const updateData: any = {
      title: args.title,
      message: args.message,
      pinned: args.pinned,
      updatedAt: now,
    };

    // Recalculate expiresAt based on pinned status
    // If pinning: clear expiration by setting to far future (won't expire)
    // If unpinning: set to 14 days from now
    if (args.pinned) {
      // Pinned announcements don't expire - set to null/undefined
      // Actually, keep current expiresAt for pinned to indicate "no expiration"
      // Don't update it - leave as is
    } else {
      // Unpinned: set to expire in 14 days
      updateData.expiresAt = now + 14 * 24 * 60 * 60 * 1000;
    }

    await ctx.db.patch(args.id, updateData);

    return args.id;
  },
});

/**
 * Delete announcement (only creator or superadmin can delete)
 */
export const deleteAnnouncement = mutation({
  args: {
    id: v.id("announcements"),
    createdByUserId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const userId = args.createdByUserId;
    const announcement = await ctx.db.get(args.id);

    if (!announcement) throw new Error("Announcement not found");

    // Only creator or superadmin can delete
    const isCreator = announcement.createdByUserId === userId;
    const isAdmin = await isSuperadmin(ctx, userId);

    if (!isCreator && !isAdmin) throw new Error("Only creator or superadmin can delete this announcement");

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List active announcements (global + cliq-specific)
 * Global announcements are visible to everyone
 * Cliq announcements are visible only to cliq members
 */
export const listActiveAnnouncements = query({
  args: { cliqId: v.optional(v.id("cliqs")) },

  handler: async (ctx, args) => {
    const now = Date.now();

    // Get all announcements
    const allAnnouncements = await ctx.db
      .query("announcements")
      .collect();

    // Filter to include:
    // 1. Global announcements (visible everywhere)
    // 2. Cliq announcements for this specific cliq (visible only to members)
    // 3. Only non-expired items (or pinned items which have no expiration)
    const filtered = allAnnouncements.filter((a) => {
      // Check if announcement is still active (not expired)
      const isActive = a.pinned === true || (a.expiresAt !== undefined && a.expiresAt > now);
      
      if (!isActive) return false;

      // Include global announcements
      if (a.visibility === "global") return true;

      // Include cliq announcements only for the matching cliq
      if (a.visibility === "cliq" && args.cliqId && a.cliqId === args.cliqId) return true;

      return false;
    });

    // Sort by creation date descending (newest first)
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get a single announcement by ID
 */
export const getAnnouncement = query({
  args: { id: v.id("announcements") },

  handler: async (ctx, args) => {
    const announcement = await ctx.db.get(args.id);
    if (!announcement) throw new Error("Announcement not found");
    return announcement;
  },
});

/**
 * List ALL announcements for a cliq (active + expired)
 * Used for admin management views
 */
export const listAllByCliq = query({
  args: { cliqId: v.id("cliqs") },

  handler: async (ctx, args) => {
    // Get all announcements for this cliq, regardless of expiration
    const cliqAnnouncements = await ctx.db
      .query("announcements")
      .withIndex("by_cliq_visibility", (q) =>
        q.eq("cliqId", args.cliqId).eq("visibility", "cliq")
      )
      .collect();

    // Sort by creation date descending (newest first)
    return cliqAnnouncements.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * List all GLOBAL announcements (active + expired)
 * Superadmin-only query for admin management
 */
export const listGlobalAnnouncements = query({
  args: {},

  handler: async (ctx) => {
    // Get all global announcements, regardless of expiration
    const globalAnnouncements = await ctx.db
      .query("announcements")
      .withIndex("by_visibility", (q) => q.eq("visibility", "global"))
      .collect();

    // Sort by creation date descending (newest first)
    return globalAnnouncements.sort((a, b) => b.createdAt - a.createdAt);
  },
});

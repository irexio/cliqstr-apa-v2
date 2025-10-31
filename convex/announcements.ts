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
    pinned: v.boolean(),
    visibility: v.union(v.literal("global"), v.literal("cliq")),
  },

  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");

    const userId = user.subject as Id<"users">;

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

    const announcementId = await ctx.db.insert("announcements", {
      title: args.title,
      message: args.message,
      cliqId: args.visibility === "cliq" ? args.cliqId : undefined,
      createdByUserId: userId,
      createdAt: now,
      pinned: args.pinned,
      expiresAt,
      visibility: args.visibility,
    });

    return announcementId;
  },
});

/**
 * Delete announcement (only creator or superadmin can delete)
 */
export const deleteAnnouncement = mutation({
  args: { id: v.id("announcements") },

  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");

    const userId = user.subject as Id<"users">;
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

    // Get all announcements that are not expired (or are pinned)
    const allAnnouncements = await ctx.db
      .query("announcements")
      .filter((q) =>
        q.or(
          q.eq(q.field("pinned"), true),
          q.gt(q.field("expiresAt"), now)
        )
      )
      .collect();

    // Filter to include global announcements + cliq announcements for this cliq
    const filtered = allAnnouncements.filter((a) => {
      if (a.visibility === "global") return true;
      if (a.visibility === "cliq" && a.cliqId && args.cliqId && a.cliqId === args.cliqId) return true;
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

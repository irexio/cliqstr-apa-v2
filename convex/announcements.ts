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

  // Compare IDs as strings to ensure proper comparison
  return cliq.ownerId.toString() === userId.toString();
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
    const results: any[] = [];

    // ========================================================================
    // 1. FETCH ANNOUNCEMENTS
    // ========================================================================
    const allAnnouncements = await ctx.db
      .query("announcements")
      .collect();

    const filtered = allAnnouncements.filter((a) => {
      const isExpired = a.expiresAt !== undefined && a.expiresAt < now;
      const isActive = a.pinned === true || !isExpired;
      if (!isActive) return false;

      if (a.visibility === "global") return true;
      if (a.visibility === "cliq" && args.cliqId && a.cliqId?.toString() === args.cliqId.toString()) return true;

      return false;
    });

    // Add announcements to results with type marker
    for (const a of filtered) {
      results.push({
        ...a,
        _type: "announcement",
      });
    }

    // ========================================================================
    // 2. FETCH EVENTS (for this cliq if provided)
    // ========================================================================
    if (args.cliqId) {
      const events = await ctx.db
        .query("events")
        .withIndex("by_cliq_start", (q: any) => q.eq("cliqId", args.cliqId))
        .collect();

      // Filter to future/current events
      const upcomingEvents = events.filter((e) => {
        if (e.deletedAt) return false;
        if (e.startAt < now) return false; // Only show future events
        return true;
      });

      // Add events to results with type marker
      for (const e of upcomingEvents) {
        results.push({
          ...e,
          _type: "event",
        });
      }

      // ========================================================================
      // 3. FETCH BIRTHDAY EVENTS (for this cliq)
      // ========================================================================
      const memberships = await ctx.db
        .query("memberships")
        .withIndex("by_cliq_id", (q: any) => q.eq("cliqId", args.cliqId))
        .collect();

      const todayUTC = new Date(now);
      todayUTC.setUTCHours(0, 0, 0, 0);
      const todayTimestamp = todayUTC.getTime();
      const todayYear = todayUTC.getUTCFullYear();
      const todayMonth = todayUTC.getUTCMonth();
      const todayDate = todayUTC.getUTCDate();

      for (const membership of memberships) {
        const profile = await ctx.db
          .query("myProfiles")
          .withIndex("by_user_id", (q: any) => q.eq("userId", membership.userId))
          .first();

        if (profile?.birthdayMonthDay) {
          const [month, day] = profile.birthdayMonthDay
            .split("-")
            .map(Number);

          const birthdayThisYearUTC = new Date(Date.UTC(todayYear, month - 1, day, 0, 0, 0, 0));
          const birthdayThisYearTimestamp = birthdayThisYearUTC.getTime();
          const endOfThisYearsWeekUTC = new Date(Date.UTC(todayYear, month - 1, day + 3, 0, 0, 0, 0));
          const endOfThisYearsWeekTimestamp = endOfThisYearsWeekUTC.getTime();

          let birthdayToUseTimestamp = birthdayThisYearTimestamp;
          if (endOfThisYearsWeekTimestamp < todayTimestamp) {
            birthdayToUseTimestamp = new Date(Date.UTC(todayYear + 1, month - 1, day, 0, 0, 0, 0)).getTime();
          }

          const startOfWeekTimestamp = birthdayToUseTimestamp - (3 * 24 * 60 * 60 * 1000);
          const endOfWeekTimestamp = birthdayToUseTimestamp + (3 * 24 * 60 * 60 * 1000) + (23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000);

          if (todayTimestamp >= startOfWeekTimestamp && todayTimestamp <= endOfWeekTimestamp) {
            results.push({
              _id: `birthday-${membership.userId}`,
              _type: "birthday",
              cliqId: args.cliqId,
              createdByUserId: membership.userId,
              title: `Happy Birthday ${profile.displayName || profile.username}!`,
              description: "Let's celebrate this week!",
              startAt: startOfWeekTimestamp,
              endAt: endOfWeekTimestamp,
              timezone: "UTC",
              location: undefined,
              locationVisibility: "hidden",
              visibilityLevel: "private",
              requiresParentApproval: false,
              rsvps: {},
              createdAt: now,
              updatedAt: now,
            });
          }
        }
      }
    }

    // Sort all results by creation time (newest first)
    return results.sort((a, b) => (b.createdAt || b._creationTime || 0) - (a.createdAt || a._creationTime || 0));
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

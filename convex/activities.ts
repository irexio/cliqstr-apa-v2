import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if a user is a child (has parent links)
 */
async function isUserChild(ctx: any, userId: Id<"users">): Promise<boolean> {
  const parentLink = await ctx.db
    .query("parentLinks")
    .withIndex("by_child_id", (q: any) => q.eq("childId", userId))
    .first();
  return !!parentLink;
}

/**
 * Get child's PHQ settings
 */
async function getChildSettings(ctx: any, userId: Id<"users">): Promise<any> {
  const profile = await ctx.db
    .query("myProfiles")
    .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
    .first();

  if (!profile) return null;

  const settings = await ctx.db
    .query("childSettings")
    .withIndex("by_profile_id", (q: any) => q.eq("profileId", profile._id))
    .first();

  return settings;
}

/**
 * Check if user is parent of a child
 */
async function isParentOf(
  ctx: any,
  parentUserId: Id<"users">,
  childUserId: Id<"users">
): Promise<boolean> {
  const parentLink = await ctx.db
    .query("parentLinks")
    .withIndex("by_parent_child", (q: any) =>
      q.eq("parentId", parentUserId).eq("childId", childUserId)
    )
    .first();
  return !!parentLink;
}

/**
 * Expand recurring events into individual instances
 */
function expandRecurrence(
  startAt: number,
  rule: string,
  timezone: string
): number[] {
  // Simple expansion: parse "FREQ=WEEKLY;COUNT=4" etc.
  const parts: any = {};
  rule.split(";").forEach((part) => {
    const [key, val] = part.split("=");
    parts[key] = val;
  });

  const freq = parts.FREQ || "ONCE";
  const count = parseInt(parts.COUNT || "1");
  const instances = [startAt];

  if (freq === "ONCE" || count <= 1) return instances;

  const msPerDay = 24 * 60 * 60 * 1000;
  const intervals: any = {
    DAILY: msPerDay,
    WEEKLY: 7 * msPerDay,
    MONTHLY: 30 * msPerDay, // Approximate
  };

  const interval = intervals[freq] || msPerDay;

  for (let i = 1; i < count; i++) {
    instances.push(startAt + i * interval);
  }

  return instances;
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new activity (event)
 * Automatically applies PHQ settings for children
 * Auto-posts to feed
 */
export const createActivity = mutation({
  args: {
    cliqId: v.id("cliqs"),
    title: v.string(),
    description: v.optional(v.string()),
    startAt: v.number(),
    endAt: v.number(),
    timezone: v.string(),
    location: v.optional(v.string()),
    createdByUserId: v.id("users"),
    recurrenceRule: v.optional(v.string()), // "FREQ=WEEKLY;COUNT=4", etc.
  },
  handler: async (ctx, args) => {
    // Verify user is member of cliq - simplified query
    try {
      const memberships = await ctx.db
        .query("memberships")
        .collect();
      
      const membership = memberships.find(
        (m: any) => m.userId === args.createdByUserId && m.cliqId === args.cliqId
      );

      if (!membership) {
        throw new Error(`User ${args.createdByUserId} is not a member of cliq ${args.cliqId}`);
      }
    } catch (membershipError: any) {
      console.error('[ACTIVITIES] Membership check failed:', membershipError?.message);
      throw membershipError;
    }

    // Check if creator is a child and apply PHQ settings
    const isChild = await isUserChild(ctx, args.createdByUserId);
    let requiresApproval = false;
    let locationVisibility: "everyone" | "parents" | "hidden" = "parents";
    let maskLocation = false;

    if (isChild) {
      const childSettings = await getChildSettings(ctx, args.createdByUserId);
      if (childSettings) {
        requiresApproval = childSettings.eventsRequireApproval;
        locationVisibility =
          childSettings.eventLocationVisibilityForChildEvents;
        maskLocation = childSettings.maskLocationUntilApproved;
      }
    }

    // If maskLocation and requiresApproval, hide location from everyone except parents
    const locationForStorage = maskLocation && requiresApproval
      ? undefined
      : args.location;

    const now = Date.now();
    const seriesId = args.recurrenceRule ? crypto.randomUUID() : undefined;

    // If recurrence rule provided, expand into individual instances
    if (args.recurrenceRule) {
      const instances = expandRecurrence(
        args.startAt,
        args.recurrenceRule,
        args.timezone
      );

      const createdIds = [];
      for (const instanceStart of instances) {
        // Calculate endAt based on duration
        const duration = args.endAt - args.startAt;
        const instanceEnd = instanceStart + duration;

        const rsvpRecord: Record<string, string> = {};
        rsvpRecord[args.createdByUserId] = "going";

        const activityId = await ctx.db.insert("activities", {
          cliqId: args.cliqId,
          title: args.title,
          description: args.description,
          startAt: instanceStart,
          endAt: instanceEnd,
          timezone: args.timezone,
          location: locationForStorage,
          locationVisibility,
          createdByUserId: args.createdByUserId,
          visibilityLevel: "private",
          requiresParentApproval: requiresApproval,
          rsvps: rsvpRecord,
          seriesId,
          recurrenceRule: args.recurrenceRule,
          createdAt: now,
          updatedAt: now,
        });

        createdIds.push(activityId);

        // Auto-post to feed
        await ctx.db.insert("posts", {
          content: `📅 **${args.title}** - ${new Date(instanceStart).toLocaleDateString()}${
            locationForStorage ? ` at ${locationForStorage}` : ""
          }`,
          createdAt: now,
          deleted: false,
          authorId: args.createdByUserId,
          cliqId: args.cliqId,
          moderationStatus: requiresApproval ? "pending" : "approved",
        });
      }

      return { success: true, activityIds: createdIds, isRecurrence: true };
    }

    // Single activity
    const rsvpRecord: Record<string, string> = {};
    rsvpRecord[args.createdByUserId] = "going";

    const activityId = await ctx.db.insert("activities", {
      cliqId: args.cliqId,
      title: args.title,
      description: args.description,
      startAt: args.startAt,
      endAt: args.endAt,
      timezone: args.timezone,
      location: locationForStorage,
      locationVisibility,
      createdByUserId: args.createdByUserId,
      visibilityLevel: "private",
      requiresParentApproval: requiresApproval,
      rsvps: rsvpRecord,
      createdAt: now,
      updatedAt: now,
    });

    // Auto-post to feed
    await ctx.db.insert("posts", {
      content: `📅 **${args.title}** - ${new Date(args.startAt).toLocaleDateString()}${
        locationForStorage ? ` at ${locationForStorage}` : ""
      }`,
      createdAt: now,
      deleted: false,
      authorId: args.createdByUserId,
      cliqId: args.cliqId,
      moderationStatus: requiresApproval ? "pending" : "approved",
    });

    console.log(`[ACTIVITIES_CREATE] Activity ${activityId} created by user ${args.createdByUserId}`);

    return { success: true, activityId };
  },
});

/**
 * Update an activity (creator or parent/admin only)
 * If child edited, reset approval status
 */
export const updateActivity = mutation({
  args: {
    activityId: v.id("activities"),
    userId: v.id("users"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startAt: v.optional(v.number()),
    endAt: v.optional(v.number()),
    timezone: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");

    // Check permissions: creator or parent
    const isCreator = activity.createdByUserId === args.userId;
    const isParent =
      (await isParentOf(ctx, args.userId, activity.createdByUserId)) ||
      activity.createdByUserId === args.userId;

    if (!isCreator && !isParent) {
      throw new Error("Only creator or parent can edit");
    }

    const now = Date.now();
    const updates: any = { updatedAt: now };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined)
      updates.description = args.description;
    if (args.startAt !== undefined) updates.startAt = args.startAt;
    if (args.endAt !== undefined) updates.endAt = args.endAt;
    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.location !== undefined) updates.location = args.location;

    // If child edited, reset approval
    const isChild = await isUserChild(ctx, args.userId);
    if (isChild && isCreator) {
      updates.requiresParentApproval = true;
      updates.approvedByParentId = undefined;
      updates.approvedAt = undefined;
    }

    await ctx.db.patch(args.activityId, updates);
    return await ctx.db.get(args.activityId);
  },
});

/**
 * Delete an activity (soft delete)
 */
export const deleteActivity = mutation({
  args: {
    activityId: v.id("activities"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");

    // Check permissions: creator or parent
    const isCreator = activity.createdByUserId === args.userId;
    const isParent = await isParentOf(
      ctx,
      args.userId,
      activity.createdByUserId
    );

    if (!isCreator && !isParent) {
      throw new Error("Only creator or parent can delete");
    }

    const now = Date.now();
    await ctx.db.patch(args.activityId, { deletedAt: now, updatedAt: now });

    console.log(`[ACTIVITIES_DELETE] Activity ${args.activityId} deleted by user ${args.userId}`);
    return { success: true };
  },
});

/**
 * Approve an activity (parent only)
 * Unlocks location visibility per PHQ settings
 */
export const approveActivity = mutation({
  args: {
    activityId: v.id("activities"),
    parentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");

    if (!activity.requiresParentApproval) {
      throw new Error("Activity does not require approval");
    }

    // Check parent permission
    const isParent = await isParentOf(
      ctx,
      args.parentUserId,
      activity.createdByUserId
    );
    if (!isParent) {
      throw new Error("Only parent can approve");
    }

    const now = Date.now();
    await ctx.db.patch(args.activityId, {
      requiresParentApproval: false,
      approvedByParentId: args.parentUserId,
      approvedAt: now,
      updatedAt: now,
      // Re-include location if it was masked
      location: activity.location || undefined,
    });

    console.log(
      `[ACTIVITIES_APPROVE] Activity ${args.activityId} approved by parent ${args.parentUserId}`
    );
    return { success: true };
  },
});

/**
 * Set RSVP for a user
 */
export const setRsvp = mutation({
  args: {
    activityId: v.id("activities"),
    userId: v.id("users"),
    status: v.union(v.literal("going"), v.literal("maybe"), v.literal("raincheck")),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");

    const updatedRsvps: Record<string, string> = { ...activity.rsvps };
    updatedRsvps[args.userId] = args.status;

    const now = Date.now();
    await ctx.db.patch(args.activityId, {
      rsvps: updatedRsvps,
      updatedAt: now,
    });

    return { success: true };
  },
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List activities by cliq with time range and filtering
 */
export const listByCliq = query({
  args: {
    cliqId: v.id("cliqs"),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
    userId: v.optional(v.id("users")), // For permission checks (location visibility)
  },
  handler: async (ctx, args) => {
    const from = args.from || Date.now();
    const to = args.to || Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year ahead

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_cliq_start", (q: any) => q.eq("cliqId", args.cliqId))
      .collect();

    const now = Date.now();

    return activities
      .filter((a) => {
        // Exclude soft-deleted
        if (a.deletedAt) return false;
        // Filter by time range
        if (a.startAt < from || a.startAt > to) return false;
        return true;
      })
      .map((a) => {
        // Apply location visibility rules
        let activity = { ...a };

        if (a.locationVisibility === "parents" && args.userId) {
          // Check if user is a parent of the creator
          const isParentOfCreator =
            ctx.db
              .query("parentLinks")
              .withIndex("by_parent_child", (q: any) =>
                q.eq("parentId", args.userId).eq("childId", a.createdByUserId)
              )
              .first() !== null;

          if (!isParentOfCreator && a.createdByUserId !== args.userId) {
            activity.location = "📍 Location visible to parents";
          }
        } else if (a.locationVisibility === "hidden") {
          activity.location = undefined;
        }

        return activity;
      })
      .sort((a, b) => a.startAt - b.startAt);
  },
});

/**
 * Get single activity with visibility rules applied
 */
export const getActivity = query({
  args: {
    activityId: v.id("activities"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity || activity.deletedAt) return null;

    // Apply location visibility
    if (args.userId) {
      const isParentOfCreator =
        (await ctx.db
          .query("parentLinks")
          .withIndex("by_parent_child", (q: any) =>
            q.eq("parentId", args.userId).eq("childId", activity.createdByUserId)
          )
          .first()) !== null;

      if (activity.locationVisibility === "parents" && !isParentOfCreator) {
        activity.location = "📍 Location visible to parents";
      } else if (activity.locationVisibility === "hidden") {
        activity.location = undefined;
      }
    }

    return activity;
  },
});

/**
 * List upcoming activities for a user across all their cliqs
 */
export const listUpcomingForUser = query({
  args: {
    userId: v.id("users"),
    now: v.optional(v.number()),
    days: v.optional(v.number()), // Lookahead days (default 30)
  },
  handler: async (ctx, args) => {
    const nowTime = args.now || Date.now();
    const lookahead = args.days || 30;
    const endTime = nowTime + lookahead * 24 * 60 * 60 * 1000;

    // Get all cliq memberships for this user
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user_id", (q: any) => q.eq("userId", args.userId))
      .collect();

    const cliqIds = memberships.map((m) => m.cliqId);

    if (cliqIds.length === 0) return [];

    // Get all activities from those cliqs
    const allActivities: any[] = [];
    for (const cliqId of cliqIds) {
      const activities = await ctx.db
        .query("activities")
        .withIndex("by_cliq_start", (q: any) => q.eq("cliqId", cliqId))
        .collect();

      allActivities.push(...activities);
    }

    return allActivities
      .filter((a) => {
        if (a.deletedAt) return false;
        if (a.startAt < nowTime || a.startAt > endTime) return false;
        return true;
      })
      .map((a) => {
        // Apply location visibility
        if (a.locationVisibility === "parents") {
          const isParentOfCreator =
            ctx.db
              .query("parentLinks")
              .withIndex("by_parent_child", (q: any) =>
                q.eq("parentId", args.userId).eq("childId", a.createdByUserId)
              )
              .first() !== null;

          if (!isParentOfCreator && a.createdByUserId !== args.userId) {
            a.location = "📍 Location visible to parents";
          }
        } else if (a.locationVisibility === "hidden") {
          a.location = undefined;
        }

        return a;
      })
      .sort((a, b) => a.startAt - b.startAt);
  },
});

/**
 * List pending activities for parent approval
 */
export const listPendingForParent = query({
  args: {
    parentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all children linked to this parent
    const parentLinks = await ctx.db
      .query("parentLinks")
      .withIndex("by_parent_id", (q: any) => q.eq("parentId", args.parentUserId))
      .collect();

    const childIds = parentLinks.map((link) => link.childId);

    if (childIds.length === 0) {
      return [];
    }

    // Get all cliqs where these children are members
    const memberships = await ctx.db
      .query("memberships")
      .collect();

    const cliqIds = memberships
      .filter((m) => childIds.includes(m.userId))
      .map((m) => m.cliqId);

    if (cliqIds.length === 0) {
      return [];
    }

    // Get all pending activities in these cliqs created by children
    const allActivities: any[] = [];
    for (const cliqId of cliqIds) {
      const activities = await ctx.db
        .query("activities")
        .withIndex("by_cliq_start", (q: any) => q.eq("cliqId", cliqId))
        .collect();

      allActivities.push(...activities);
    }

    return allActivities
      .filter((a) => {
        return (
          childIds.includes(a.createdByUserId) &&
          a.requiresParentApproval &&
          !a.deletedAt
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Generate birthday activities (synthetic, not stored)
 */
export const getBirthdayActivities = query({
  args: {
    cliqId: v.id("cliqs"),
  },
  handler: async (ctx, args) => {
    // Get all members of this cliq
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_cliq_id", (q: any) => q.eq("cliqId", args.cliqId))
      .collect();

    const birthdayActivities = [];
    const now = Date.now();
    const today = new Date(now);

    for (const membership of memberships) {
      // Get user's profile to check birthday
      const profile = await ctx.db
        .query("myProfiles")
        .withIndex("by_user_id", (q: any) => q.eq("userId", membership.userId))
        .first();

      if (profile?.birthdayMonthDay) {
        const [month, day] = profile.birthdayMonthDay
          .split("-")
          .map(Number);

        // Calculate next birthday
        let nextBirthday = new Date(
          today.getFullYear(),
          month - 1,
          day
        );
        if (nextBirthday < today) {
          nextBirthday = new Date(
            today.getFullYear() + 1,
            month - 1,
            day
          );
        }

        // Start at 9 AM, end at 11:59 PM
        const startAt = new Date(nextBirthday);
        startAt.setHours(9, 0, 0, 0);
        const endAt = new Date(nextBirthday);
        endAt.setHours(23, 59, 59, 999);

        birthdayActivities.push({
          _id: `birthday-${membership.userId}` as any,
          cliqId: args.cliqId,
          createdByUserId: membership.userId,
          title: `🎂 ${profile.displayName || profile.username}'s Birthday`,
          description: "Happy Birthday!",
          startAt: startAt.getTime(),
          endAt: endAt.getTime(),
          timezone: "UTC",
          location: undefined,
          locationVisibility: "hidden" as const,
          visibilityLevel: "private",
          requiresParentApproval: false,
          rsvps: {},
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return birthdayActivities;
  },
});

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
 * Create a new event
 * Automatically applies PHQ settings for children
 */
export const createEvent = mutation({
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
        throw new Error(`User is not a member of this cliq`);
      }
    } catch (membershipError: any) {
      console.error('[EVENTS] Membership check failed:', membershipError?.message);
      throw membershipError;
    }

    console.log('[EVENTS] Creating event with args:', {
      cliqId: args.cliqId,
      title: args.title,
      createdByUserId: args.createdByUserId,
    });

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

    console.log('[EVENTS] PHQ settings applied:', {
      isChild,
      requiresApproval,
      locationVisibility,
      maskLocation,
    });

    // If maskLocation and requiresApproval, hide location from everyone except parents
    const locationForStorage = maskLocation && requiresApproval
      ? undefined
      : args.location;

    const now = Date.now();
    const seriesId = args.recurrenceRule ? crypto.randomUUID() : undefined;

    console.log('[EVENTS] About to insert event into DB');

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
        rsvpRecord[args.createdByUserId.toString()] = "going";

        const eventId = await ctx.db.insert("events", {
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

        createdIds.push(eventId);
      }

      return { success: true, eventIds: createdIds, isRecurrence: true };
    }

    // Single event
    const rsvpRecord: Record<string, string> = {};
    rsvpRecord[args.createdByUserId.toString()] = "going";

    const eventId = await ctx.db.insert("events", {
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

    console.log(`[EVENTS_CREATE] Event ${eventId} created by user ${args.createdByUserId}`);

    return { success: true, eventId };
  },
});

/**
 * Update an event (creator or parent/admin only)
 * If child edited, reset approval status
 */
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startAt: v.optional(v.number()),
    endAt: v.optional(v.number()),
    timezone: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Check permissions: creator or parent
    const isCreator = event.createdByUserId === args.userId;
    const isParent =
      (await isParentOf(ctx, args.userId, event.createdByUserId)) ||
      event.createdByUserId === args.userId;

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

    await ctx.db.patch(args.eventId, updates);
    return await ctx.db.get(args.eventId);
  },
});

/**
 * Delete an event (hard delete)
 */
export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Check permissions: creator, parent, or cliq owner
    const isCreator = event.createdByUserId === args.userId;
    const isParent = await isParentOf(
      ctx,
      args.userId,
      event.createdByUserId
    );

    // Check if user is cliq owner
    const cliq = await ctx.db.get(event.cliqId);
    const isCliqOwner = cliq && cliq.ownerId === args.userId;

    if (!isCreator && !isParent && !isCliqOwner) {
      throw new Error("Only creator, parent, or cliq owner can delete");
    }

    // Hard delete the event
    await ctx.db.delete(args.eventId);

    console.log(`[EVENTS_DELETE] Event ${args.eventId} permanently deleted by user ${args.userId}`);
    return { success: true };
  },
});

/**
 * Approve an event (parent only)
 * Unlocks location visibility per PHQ settings
 */
export const approveEvent = mutation({
  args: {
    eventId: v.id("events"),
    parentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    if (!event.requiresParentApproval) {
      throw new Error("Event does not require approval");
    }

    // Check parent permission
    const isParent = await isParentOf(
      ctx,
      args.parentUserId,
      event.createdByUserId
    );
    if (!isParent) {
      throw new Error("Only parent can approve");
    }

    const now = Date.now();
    await ctx.db.patch(args.eventId, {
      requiresParentApproval: false,
      approvedByParentId: args.parentUserId,
      approvedAt: now,
      updatedAt: now,
      // Re-include location if it was masked
      location: event.location || undefined,
    });

    console.log(
      `[EVENTS_APPROVE] Event ${args.eventId} approved by parent ${args.parentUserId}`
    );
    return { success: true };
  },
});

/**
 * Set RSVP for a user
 */
export const setRsvp = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
    status: v.union(v.literal("going"), v.literal("maybe"), v.literal("raincheck")),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const updatedRsvps: Record<string, string> = { ...event.rsvps };
    updatedRsvps[args.userId.toString()] = args.status;

    const now = Date.now();
    await ctx.db.patch(args.eventId, {
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
 * List events by cliq with time range and filtering
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

    const events = await ctx.db
      .query("events")
      .withIndex("by_cliq_start", (q: any) => q.eq("cliqId", args.cliqId))
      .collect();

    const now = Date.now();

    // First filter events
    const filtered = events.filter((a) => {
      // Exclude soft-deleted
      if (a.deletedAt) return false;
      // Filter by time range
      if (a.startAt < from || a.startAt > to) return false;
      return true;
    });

    // Then map with location visibility (simplified - don't apply async checks in map)
    const mapped = filtered.map((a) => {
      // Apply location visibility rules
      let event = { ...a };

      if (a.locationVisibility === "parents" && args.userId) {
        // For now, just check if it's the creator themselves
        if (a.createdByUserId !== args.userId) {
          event.location = "📍 Location visible to parents only";
        }
      } else if (a.locationVisibility === "hidden") {
        event.location = undefined;
      }

      return event;
    });

    return mapped.sort((a, b) => a.startAt - b.startAt);
  },
});

/**
 * Get single event with visibility rules applied
 */
export const getEvent = query({
  args: {
    eventId: v.id("events"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.deletedAt) return null;

    // Apply location visibility
    if (args.userId) {
      const isParentOfCreator =
        (await ctx.db
          .query("parentLinks")
          .withIndex("by_parent_child", (q: any) =>
            q.eq("parentId", args.userId).eq("childId", event.createdByUserId)
          )
          .first()) !== null;

      if (event.locationVisibility === "parents" && !isParentOfCreator) {
        event.location = "📍 Location visible to parents";
      } else if (event.locationVisibility === "hidden") {
        event.location = undefined;
      }
    }

    return event;
  },
});

/**
 * List upcoming events for a user across all their cliqs
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

    // Get all events from those cliqs
    const allEvents: any[] = [];
    for (const cliqId of cliqIds) {
      const events = await ctx.db
        .query("events")
        .withIndex("by_cliq_start", (q: any) => q.eq("cliqId", cliqId))
        .collect();

      allEvents.push(...events);
    }

    return allEvents
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
 * List pending events for parent approval
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

    // Get all pending events in these cliqs created by children
    const allEvents: any[] = [];
    for (const cliqId of cliqIds) {
      const events = await ctx.db
        .query("events")
        .withIndex("by_cliq_start", (q: any) => q.eq("cliqId", cliqId))
        .collect();

      allEvents.push(...events);
    }

    return allEvents
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
 * Generate birthday events (synthetic, not stored)
 * Shows birthday for a full week: 3 days before to 3 days after
 */
export const getBirthdayEvents = query({
  args: {
    cliqId: v.id("cliqs"),
  },
  handler: async (ctx, args) => {
    // Get all members of this cliq
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_cliq_id", (q: any) => q.eq("cliqId", args.cliqId))
      .collect();

    const birthdayEvents = [];
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

        // Calculate this year's birthday
        const thisBirthdayThisYear = new Date(
          today.getFullYear(),
          month - 1,
          day,
          12, 0, 0, 0 // Set to noon to avoid time zone issues
        );
        
        // Determine which year's birthday to use for the week calculation
        let birthdayToUse = thisBirthdayThisYear;
        
        // If this year's birthday + 3 days (end of week) has already passed, use next year
        const endOfThisYearsWeek = new Date(thisBirthdayThisYear);
        endOfThisYearsWeek.setDate(endOfThisYearsWeek.getDate() + 3);
        
        if (endOfThisYearsWeek < today) {
          birthdayToUse = new Date(
            today.getFullYear() + 1,
            month - 1,
            day,
            12, 0, 0, 0
          );
        }

        // Birthday week: 3 days before to 3 days after
        const startOfWeek = new Date(birthdayToUse);
        startOfWeek.setDate(startOfWeek.getDate() - 3);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(birthdayToUse);
        endOfWeek.setDate(endOfWeek.getDate() + 3);
        endOfWeek.setHours(23, 59, 59, 999);

        // Only include if the week overlaps with today
        if (today >= startOfWeek && today <= endOfWeek) {
          birthdayEvents.push({
            _id: `birthday-${membership.userId}` as any,
            cliqId: args.cliqId,
            createdByUserId: membership.userId,
            title: `Happy Birthday ${profile.displayName || profile.username}!`,
            description: "Let's celebrate this week!",
            startAt: startOfWeek.getTime(),
            endAt: endOfWeek.getTime(),
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
    }

    return birthdayEvents;
  },
});

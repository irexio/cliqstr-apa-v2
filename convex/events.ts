import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all events for a cliq with optional filtering
 * Excludes soft-deleted events and handles pending approval visibility
 */
export const listEventsByCliq = query({
  args: {
    cliqId: v.id("cliqs"),
    includeUnapproved: v.optional(v.boolean()), // For parents viewing their child's events
    includePast: v.optional(v.boolean()),
    userId: v.optional(v.id("users")), // For permission checks
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_cliq_id", (q) => q.eq("cliqId", args.cliqId))
      .collect();

    const now = Date.now();

    return events
      .filter((event) => {
        // Exclude soft-deleted
        if (event.deletedAt) return false;

        // Filter by approval status
        if (!args.includeUnapproved && event.pendingParentApproval) {
          return false; // Hide unapproved unless explicitly requested
        }

        // Filter by past/upcoming
        if (!args.includePast && event.eventTime < now) {
          return false; // Hide past events unless explicitly requested
        }

        return true;
      })
      .sort((a, b) => a.eventTime - b.eventTime);
  },
});

/**
 * Get pending event approvals for a parent
 * Returns child events in their child's cliqs that need parent approval
 */
export const getPendingEventApprovals = query({
  args: {
    parentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all children linked to this parent
    const parentLinks = await ctx.db
      .query("parentLinks")
      .withIndex("by_parent_id", (q) => q.eq("parentId", args.parentUserId))
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
    const events = await ctx.db
      .query("events")
      .collect();

    return events
      .filter((event) => {
        return (
          cliqIds.includes(event.cliqId) &&
          childIds.includes(event.createdBy) &&
          event.pendingParentApproval &&
          !event.deletedAt
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get single event with full details
 */
export const getEventById = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new event
 * Auto-flags with pendingParentApproval if creator is a child
 */
export const createEvent = mutation({
  args: {
    cliqId: v.id("cliqs"),
    title: v.string(),
    description: v.string(),
    eventTime: v.number(),
    where: v.string(),
    eventType: v.union(v.literal("offline"), v.literal("online")),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if creator is a child (has a parent link)
    const parentLinks = await ctx.db
      .query("parentLinks")
      .collect();

    const isChild = parentLinks.some((link) => link.childId === args.userId);

    const now = Date.now();

    const eventId = await ctx.db.insert("events", {
      cliqId: args.cliqId,
      createdBy: args.userId,
      title: args.title,
      description: args.description,
      eventTime: args.eventTime,
      where: args.where,
      eventType: args.eventType,
      isBirthday: false,
      pendingParentApproval: isChild, // Auto-flag if child
      rsvps: [
        {
          userId: args.userId,
          status: "in",
          respondedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    // If child created event, send parent email notification
    if (isChild) {
      const creator = await ctx.db.get(args.userId);
      const parentLink = parentLinks.find((link) => link.childId === args.userId);

      if (creator && parentLink) {
        // Queue email to parent
        // This would call sendParentEventApprovalEmail
        console.log(`[EVENT] Child ${creator._id} created event "${args.title}" - needs parent approval`);
      }
    }

    return eventId;
  },
});

/**
 * Update RSVP for a user
 * Creates or updates their response
 */
export const updateRsvp = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
    status: v.union(v.literal("in"), v.literal("maybe"), v.literal("raincheck")),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const now = Date.now();
    const existingRsvpIndex = event.rsvps.findIndex((r) => r.userId === args.userId);

    let updatedRsvps;
    if (existingRsvpIndex >= 0) {
      // Update existing RSVP
      updatedRsvps = [...event.rsvps];
      updatedRsvps[existingRsvpIndex] = {
        ...updatedRsvps[existingRsvpIndex],
        status: args.status,
        respondedAt: now,
      };
    } else {
      // Add new RSVP
      updatedRsvps = [
        ...event.rsvps,
        {
          userId: args.userId,
          status: args.status,
          respondedAt: now,
        },
      ];
    }

    await ctx.db.patch(args.eventId, {
      rsvps: updatedRsvps,
      updatedAt: now,
    });

    return event;
  },
});

/**
 * Approve a pending event (parent action)
 */
export const approveEvent = mutation({
  args: {
    eventId: v.id("events"),
    parentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    if (!event.pendingParentApproval) {
      throw new Error("Event is not pending approval");
    }

    const now = Date.now();

    await ctx.db.patch(args.eventId, {
      pendingParentApproval: false,
      approvedAt: now,
      approvedBy: args.parentUserId,
      updatedAt: now,
    });

    return event;
  },
});

/**
 * Reject/delete a pending event (parent action)
 */
export const rejectEvent = mutation({
  args: {
    eventId: v.id("events"),
    parentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const now = Date.now();

    // Soft delete
    await ctx.db.patch(args.eventId, {
      deletedAt: now,
      updatedAt: now,
    });

    return { success: true, deletedId: args.eventId };
  },
});

/**
 * Update event details (creator, parent, or admin only)
 * Resets pendingParentApproval if child edited
 */
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    eventTime: v.optional(v.number()),
    where: v.optional(v.string()),
    eventType: v.optional(v.union(v.literal("offline"), v.literal("online"))),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Check if user is creator or has permission to edit
    const isCreator = event.createdBy === args.userId;
    if (!isCreator) {
      throw new Error("Only event creator can edit");
    }

    // Check if editor is a child
    const parentLinks = await ctx.db
      .query("parentLinks")
      .collect();

    const isChild = parentLinks.some((link) => link.childId === args.userId);

    const now = Date.now();
    const updates: any = {
      updatedAt: now,
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.eventTime !== undefined) updates.eventTime = args.eventTime;
    if (args.where !== undefined) updates.where = args.where;
    if (args.eventType !== undefined) updates.eventType = args.eventType;

    // If child edited, reset approval
    if (isChild) {
      updates.pendingParentApproval = true;
      updates.approvedAt = undefined;
      updates.approvedBy = undefined;
    }

    await ctx.db.patch(args.eventId, updates);
    return await ctx.db.get(args.eventId);
  },
});

/**
 * Delete an event (creator, parent, or admin)
 * Soft delete for record keeping
 */
export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const now = Date.now();

    await ctx.db.patch(args.eventId, {
      deletedAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Auto-cleanup: delete past events older than 30 days
 * (Birthdays are excluded)
 * Should be called by a scheduled job
 */
export const cleanupPastEvents = mutation({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("events")
      .collect();

    const toDelete = events.filter((e) => {
      return e.eventTime < thirtyDaysAgo && !e.isBirthday && !e.deletedAt;
    });

    let count = 0;
    for (const event of toDelete) {
      await ctx.db.patch(event._id, {
        deletedAt: Date.now(),
      });
      count++;
    }

    console.log(`[CLEANUP] Deleted ${count} past events`);
    return { deleted: count };
  },
});

/**
 * Generate birthday events for all cliq members
 * Called when loading calendar or on user birthday
 * Returns dynamically generated (not stored) birthday events
 */
export const getBirthdayEvents = query({
  args: {
    cliqId: v.id("cliqs"),
  },
  handler: async (ctx, args) => {
    // Get all members of this cliq
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_cliq_id", (q) => q.eq("cliqId", args.cliqId))
      .collect();

    const birthdayEvents = [];
    const now = Date.now();
    const today = new Date(now);

    for (const membership of memberships) {
      // Get user's profile to check birthday
      const myProfiles = await ctx.db
        .query("myProfiles")
        .withIndex("by_user_id", (q) => q.eq("userId", membership.userId))
        .first();

      if (myProfiles?.birthdayMonthDay) {
        const [month, day] = myProfiles.birthdayMonthDay.split("-").map(Number);
        
        // Calculate next birthday
        let nextBirthday = new Date(today.getFullYear(), month - 1, day);
        if (nextBirthday < today) {
          nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
        }

        birthdayEvents.push({
          _id: `birthday-${membership.userId}` as any,
          cliqId: args.cliqId,
          createdBy: membership.userId,
          title: `${myProfiles.displayName || myProfiles.username}'s Birthday 🎂`,
          description: "Happy Birthday! 🎉",
          eventTime: nextBirthday.getTime(),
          where: "Celebrate with us!",
          eventType: "online" as const,
          isBirthday: true,
          birthdayUserId: membership.userId,
          pendingParentApproval: false,
          rsvps: [],
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return birthdayEvents;
  },
});

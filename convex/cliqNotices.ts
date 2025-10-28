import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create cliq notice
export const createNotice = mutation({
  args: {
    cliqId: v.id("cliqs"),
    type: v.string(),
    content: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const noticeId = await ctx.db.insert("cliqNotices", {
      cliqId: args.cliqId,
      type: args.type,
      content: args.content,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });

    return noticeId;
  },
});

// Get notices by cliq (active/non-expired only)
export const getNoticesByCliq = query({
  args: {
    cliqId: v.id("cliqs"),
  },
  handler: async (ctx, args) => {
    const notices = await ctx.db
      .query("cliqNotices")
      .withIndex("by_cliq_id", (q) => q.eq("cliqId", args.cliqId))
      .collect();

    // Filter out expired notices
    return notices.filter((n) => !n.expiresAt || n.expiresAt > Date.now());
  },
});

// Keep old name for backwards compatibility
export const getByCliqId = query({
  args: {
    cliqId: v.id("cliqs"),
  },
  handler: async (ctx, args) => {
    const notices = await ctx.db
      .query("cliqNotices")
      .withIndex("by_cliq_id", (q) => q.eq("cliqId", args.cliqId))
      .collect();

    return notices.filter((n) => !n.expiresAt || n.expiresAt > Date.now());
  },
});

// Update notice
export const updateNotice = mutation({
  args: {
    noticeId: v.id("cliqNotices"),
    content: v.optional(v.string()),
    type: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const notice = await ctx.db.get(args.noticeId);
    if (!notice) throw new Error("Notice not found");

    const updates: any = {};
    if (args.content !== undefined) updates.content = args.content;
    if (args.type !== undefined) updates.type = args.type;
    if (args.expiresAt !== undefined) updates.expiresAt = args.expiresAt;

    await ctx.db.patch(args.noticeId, updates);
    return args.noticeId;
  },
});

// Delete notice
export const deleteNotice = mutation({
  args: {
    noticeId: v.id("cliqNotices"),
  },
  handler: async (ctx, args) => {
    const notice = await ctx.db.get(args.noticeId);
    if (!notice) throw new Error("Notice not found");

    await ctx.db.delete(args.noticeId);
    return { success: true };
  },
});

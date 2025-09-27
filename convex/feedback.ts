import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new feedback submission
export const createFeedback = mutation({
  args: {
    userId: v.id("users"),
    userEmail: v.string(),
    category: v.union(v.literal("Bug"), v.literal("Idea"), v.literal("General Comment")),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const feedbackId = await ctx.db.insert("feedback", {
      userId: args.userId,
      userEmail: args.userEmail,
      category: args.category,
      message: args.message,
      status: "new",
      createdAt: Date.now(),
    });

    return feedbackId;
  },
});

// Get all feedback submissions (for admin use)
export const getAllFeedback = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("feedback")
      .withIndex("by_created_at")
      .order("desc")
      .collect();
  },
});

// Get feedback by user
export const getFeedbackByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("feedback")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Update feedback status (for admin use)
export const updateFeedbackStatus = mutation({
  args: {
    feedbackId: v.id("feedback"),
    status: v.union(v.literal("new"), v.literal("reviewed"), v.literal("resolved")),
    reviewedBy: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    };

    if (args.status === "reviewed" || args.status === "resolved") {
      updates.reviewedAt = Date.now();
      if (args.reviewedBy) {
        updates.reviewedBy = args.reviewedBy;
      }
    }

    if (args.adminNotes) {
      updates.adminNotes = args.adminNotes;
    }

    await ctx.db.patch(args.feedbackId, updates);
  },
});

// Get feedback statistics (for admin dashboard)
export const getFeedbackStats = query({
  args: {},
  handler: async (ctx) => {
    const allFeedback = await ctx.db.query("feedback").collect();
    
    const stats = {
      total: allFeedback.length,
      byCategory: {
        Bug: 0,
        Idea: 0,
        "General Comment": 0,
      },
      byStatus: {
        new: 0,
        reviewed: 0,
        resolved: 0,
      },
    };

    allFeedback.forEach((feedback) => {
      stats.byCategory[feedback.category]++;
      stats.byStatus[feedback.status]++;
    });

    return stats;
  },
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all parent links for a child
export const getParentLinksByChildId = query({
  args: { childId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("parentLinks")
      .withIndex("by_child_id", (q) => q.eq("childId", args.childId))
      .collect();
  },
});

// Get parent link by email and child ID
export const getParentLinkByEmailAndChild = query({
  args: { 
    email: v.string(),
    childId: v.id("users")
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("parentLinks")
      .withIndex("by_email_child", (q) => q.eq("email", args.email).eq("childId", args.childId))
      .first();
  },
});

// Get parent link by parent and child
export const getParentLinkByParentAndChild = query({
  args: {
    parentId: v.id("users"),
    childId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("parentLinks")
      .withIndex("by_parent_child", (q) => q.eq("parentId", args.parentId).eq("childId", args.childId))
      .first();
  },
});

// Create a new parent link
export const createParentLink = mutation({
  args: {
    email: v.string(),
    childId: v.id("users"),
    role: v.optional(v.union(v.literal("primary"), v.literal("secondary"), v.literal("guardian"))),
    permissions: v.optional(v.object({
      canManageChild: v.boolean(),
      canChangeSettings: v.boolean(),
      canViewActivity: v.boolean(),
      receivesNotifications: v.boolean(),
    })),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // For now, we'll create the link without a parentId since the parent might not have an account yet
    // The parentId will be set when the parent accepts the invitation
    const linkId = await ctx.db.insert("parentLinks", {
      parentId: "" as any, // Temporary - will be updated when parent accepts
      email: args.email,
      childId: args.childId,
      type: args.type,
      role: args.role || "secondary",
      permissions: args.permissions || {
        canManageChild: false,
        canChangeSettings: false,
        canViewActivity: true,
        receivesNotifications: true,
      },
      createdAt: now,
    });

    return linkId;
  },
});

// Remove a parent link
export const removeParentLink = mutation({
  args: {
    parentId: v.id("users"),
    childId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("parentLinks")
      .withIndex("by_parent_child", (q) => q.eq("parentId", args.parentId).eq("childId", args.childId))
      .first();

    if (!link) {
      throw new Error("Parent link not found");
    }

    await ctx.db.delete(link._id);
    return link._id;
  },
});

// Update parent link permissions
export const updateParentLinkPermissions = mutation({
  args: {
    parentId: v.id("users"),
    childId: v.id("users"),
    permissions: v.object({
      canManageChild: v.boolean(),
      canChangeSettings: v.boolean(),
      canViewActivity: v.boolean(),
      receivesNotifications: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("parentLinks")
      .withIndex("by_parent_child", (q) => q.eq("parentId", args.parentId).eq("childId", args.childId))
      .first();

    if (!link) {
      throw new Error("Parent link not found");
    }

    await ctx.db.patch(link._id, {
      permissions: args.permissions,
    });

    return link._id;
  },
});

// Update parent link role
export const updateParentLinkRole = mutation({
  args: {
    parentId: v.id("users"),
    childId: v.id("users"),
    role: v.union(v.literal("primary"), v.literal("secondary"), v.literal("guardian")),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("parentLinks")
      .withIndex("by_parent_child", (q) => q.eq("parentId", args.parentId).eq("childId", args.childId))
      .first();

    if (!link) {
      throw new Error("Parent link not found");
    }

    await ctx.db.patch(link._id, {
      role: args.role,
    });

    return link._id;
  },
});

// Accept parent invitation (when parent clicks link and creates account)
export const acceptParentInvitation = mutation({
  args: {
    email: v.string(),
    childId: v.id("users"),
    parentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("parentLinks")
      .withIndex("by_email_child", (q) => q.eq("email", args.email).eq("childId", args.childId))
      .first();

    if (!link) {
      throw new Error("Parent invitation not found");
    }

    await ctx.db.patch(link._id, {
      parentId: args.parentId,
    });

    return link._id;
  },
});

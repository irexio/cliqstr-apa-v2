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

// Get all children for a parent
export const getChildrenByParent = query({
  args: { parentId: v.id("users") },
  handler: async (ctx, args) => {
    const parentLinks = await ctx.db
      .query("parentLinks")
      .withIndex("by_parent_id", (q) => q.eq("parentId", args.parentId))
      .collect();

    // Get child details for each link
    const children = await Promise.all(
      parentLinks.map(async (link) => {
        const child = await ctx.db.get(link.childId);
        const childProfile = await ctx.db
          .query("myProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", link.childId))
          .first();
        
        return {
          id: link.childId,
          name: childProfile?.username || child?.email || 'Unknown',
          email: child?.email,
          profile: childProfile,
          parentLink: link,
        };
      })
    );

    return children;
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
    
    // We need to find the parent by email first
    const parent = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!parent) {
      throw new Error(`Parent with email ${args.email} not found`);
    }
    
    const linkId = await ctx.db.insert("parentLinks", {
      parentId: parent._id,
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

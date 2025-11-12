import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create or seed avatar into the library
 */
export const createAvatar = mutation({
  args: {
    id: v.string(),
    displayName: v.string(),
    category: v.string(),
    subcategory: v.string(),
    tags: v.array(v.string()),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("avatarLibrary")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();

    if (existing) {
      console.log(`[AVATAR] Avatar ${args.id} already exists, skipping`);
      return existing;
    }

    const now = Date.now();
    const avatarId = await ctx.db.insert("avatarLibrary", {
      id: args.id,
      displayName: args.displayName,
      category: args.category,
      subcategory: args.subcategory,
      tags: args.tags,
      description: args.description,
      createdAt: now,
    });

    console.log(`[AVATAR] Created avatar: ${args.displayName}`);
    return avatarId;
  },
});

/**
 * Get all avatars
 */
export const getAllAvatars = query({
  handler: async (ctx) => {
    const avatars = await ctx.db.query("avatarLibrary").collect();
    return avatars.sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

/**
 * Get avatars by category
 */
export const listByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const avatars = await ctx.db
      .query("avatarLibrary")
      .withIndex("by_category", (q) => q.eq("category", args.category.toLowerCase()))
      .collect();

    return avatars.sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

/**
 * Get avatars by subcategory
 */
export const listBySubcategory = query({
  args: { subcategory: v.string() },
  handler: async (ctx, args) => {
    const avatars = await ctx.db
      .query("avatarLibrary")
      .withIndex("by_subcategory", (q) =>
        q.eq("subcategory", args.subcategory.toLowerCase())
      )
      .collect();

    return avatars.sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

/**
 * Search avatars by name or tags
 */
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const allAvatars = await ctx.db.query("avatarLibrary").collect();
    const lowerQuery = args.query.toLowerCase();

    const results = allAvatars.filter(
      (avatar) =>
        avatar.displayName.toLowerCase().includes(lowerQuery) ||
        avatar.id.toLowerCase().includes(lowerQuery) ||
        avatar.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );

    return results.sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

/**
 * Get random avatar from a category
 */
export const getRandomByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const avatars = await ctx.db
      .query("avatarLibrary")
      .withIndex("by_category", (q) => q.eq("category", args.category.toLowerCase()))
      .collect();

    if (avatars.length === 0) return null;
    return avatars[Math.floor(Math.random() * avatars.length)];
  },
});

/**
 * Get a specific avatar by ID
 */
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const avatar = await ctx.db
      .query("avatarLibrary")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();

    return avatar || null;
  },
});

/**
 * Get all unique categories (for filtering)
 */
export const getCategories = query({
  handler: async (ctx) => {
    const avatars = await ctx.db.query("avatarLibrary").collect();
    const categories = new Set(avatars.map((a) => a.category));
    return Array.from(categories).sort();
  },
});

/**
 * Batch seed avatars (for initial setup from CSV)
 */
export const batchSeed = mutation({
  args: {
    avatars: v.array(
      v.object({
        id: v.string(),
        displayName: v.string(),
        category: v.string(),
        subcategory: v.string(),
        tags: v.array(v.string()),
        description: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let created = 0;
    let skipped = 0;

    for (const avatar of args.avatars) {
      const existing = await ctx.db
        .query("avatarLibrary")
        .filter((q) => q.eq(q.field("id"), avatar.id))
        .first();

      if (!existing) {
        await ctx.db.insert("avatarLibrary", {
          ...avatar,
          createdAt: Date.now(),
        });
        created++;
      } else {
        skipped++;
      }
    }

    console.log(
      `[AVATAR BATCH] Created: ${created}, Skipped: ${skipped}`
    );

    return { created, skipped, total: args.avatars.length };
  },
});


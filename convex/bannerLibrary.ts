import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create or seed banner into the library
 */
export const createBanner = mutation({
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
      .query("bannerLibrary")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();

    if (existing) {
      console.log(`[BANNER] Banner ${args.id} already exists, skipping`);
      return existing;
    }

    const now = Date.now();
    const bannerId = await ctx.db.insert("bannerLibrary", {
      id: args.id,
      displayName: args.displayName,
      category: args.category,
      subcategory: args.subcategory,
      tags: args.tags,
      description: args.description,
      createdAt: now,
    });

    console.log(`[BANNER] Created banner: ${args.displayName}`);
    return bannerId;
  },
});

/**
 * Get all banners
 */
export const getAllBanners = query({
  handler: async (ctx) => {
    const banners = await ctx.db.query("bannerLibrary").collect();
    return banners.sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

/**
 * Get banners by category
 */
export const listByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const banners = await ctx.db
      .query("bannerLibrary")
      .withIndex("by_category", (q) => q.eq("category", args.category.toLowerCase()))
      .collect();

    return banners.sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

/**
 * Get banners by subcategory
 */
export const listBySubcategory = query({
  args: { subcategory: v.string() },
  handler: async (ctx, args) => {
    const banners = await ctx.db
      .query("bannerLibrary")
      .withIndex("by_subcategory", (q) =>
        q.eq("subcategory", args.subcategory.toLowerCase())
      )
      .collect();

    return banners.sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

/**
 * Search banners by name or tags
 */
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const allBanners = await ctx.db.query("bannerLibrary").collect();
    const lowerQuery = args.query.toLowerCase();

    const results = allBanners.filter(
      (banner) =>
        banner.displayName.toLowerCase().includes(lowerQuery) ||
        banner.id.toLowerCase().includes(lowerQuery) ||
        banner.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );

    return results.sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

/**
 * Get random banner from a category
 */
export const getRandomByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const banners = await ctx.db
      .query("bannerLibrary")
      .withIndex("by_category", (q) => q.eq("category", args.category.toLowerCase()))
      .collect();

    if (banners.length === 0) return null;
    return banners[Math.floor(Math.random() * banners.length)];
  },
});

/**
 * Get a specific banner by ID
 */
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const banner = await ctx.db
      .query("bannerLibrary")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();

    return banner || null;
  },
});

/**
 * Get all unique categories (for filtering)
 */
export const getCategories = query({
  handler: async (ctx) => {
    const banners = await ctx.db.query("bannerLibrary").collect();
    const categories = new Set(banners.map((b) => b.category));
    return Array.from(categories).sort();
  },
});

/**
 * Batch seed banners (for initial setup)
 */
export const batchSeed = mutation({
  args: {
    banners: v.array(
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

    for (const banner of args.banners) {
      const existing = await ctx.db
        .query("bannerLibrary")
        .filter((q) => q.eq(q.field("id"), banner.id))
        .first();

      if (!existing) {
        await ctx.db.insert("bannerLibrary", {
          ...banner,
          createdAt: Date.now(),
        });
        created++;
      } else {
        skipped++;
      }
    }

    console.log(
      `[BANNER BATCH] Created: ${created}, Skipped: ${skipped}`
    );

    return { created, skipped, total: args.banners.length };
  },
});


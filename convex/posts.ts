import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get single post
export const getPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.postId);
  },
});

// Get posts for a cliq
export const getCliqPosts = query({
  args: { 
    cliqId: v.id("cliqs"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is a member of this cliq
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_cliq", (q) => 
        q.eq("userId", args.userId).eq("cliqId", args.cliqId)
      )
      .first();

    if (!membership) {
      throw new Error("Not authorized to access this cliq");
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_cliq_id", (q) => q.eq("cliqId", args.cliqId))
      .filter((q) => q.eq(q.field("deleted"), false))
      .order("desc")
      .collect();

    // Get author info for each post
    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        const authorProfile = await ctx.db
          .query("myProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", post.authorId))
          .first();

        const authorAccount = await ctx.db
          .query("accounts")
          .withIndex("by_user_id", (q) => q.eq("userId", post.authorId))
          .first();

        const replies = await ctx.db
          .query("replies")
          .withIndex("by_post_id", (q) => q.eq("postId", post._id))
          .collect();

        return {
          id: post._id,
          content: post.content,
          image: post.image,
          createdAt: post.createdAt,
          authorId: post.authorId,
          cliqId: post.cliqId,
          expiresAt: post.expiresAt,
          author: author ? {
            id: author._id,
            email: author.email,
            profile: authorProfile ? {
              username: authorProfile.username,
              firstName: authorAccount?.firstName,
              lastName: authorAccount?.lastName,
              image: authorProfile.image,
            } : null,
          } : null,
          replies: replies.map(reply => ({
            id: reply._id,
            content: reply.content,
            createdAt: reply.createdAt,
            authorId: reply.authorId,
          })),
        };
      })
    );

    return postsWithAuthors;
  },
});

// Create new post
export const createPost = mutation({
  args: {
    content: v.string(),
    image: v.optional(v.string()),
    authorId: v.id("users"),
    cliqId: v.id("cliqs"),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user is a member of this cliq
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_cliq", (q) => 
        q.eq("userId", args.authorId).eq("cliqId", args.cliqId)
      )
      .first();

    if (!membership) {
      throw new Error("Not authorized to post in this cliq");
    }

    const postId = await ctx.db.insert("posts", {
      content: args.content,
      image: args.image,
      createdAt: Date.now(),
      deleted: false,
      authorId: args.authorId,
      cliqId: args.cliqId,
      expiresAt: args.expiresAt,
    });

    return postId;
  },
});

// Delete post (soft delete)
export const deletePost = mutation({
  args: { 
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Only author or cliq owner can delete
    if (post.authorId !== args.userId) {
      const cliq = await ctx.db.get(post.cliqId);
      if (cliq?.ownerId !== args.userId) {
        throw new Error("Not authorized to delete this post");
      }
    }

    await ctx.db.patch(args.postId, {
      deleted: true,
    });
  },
});

// Update post (author only)
export const updatePost = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Only author can update
    if (post.authorId !== args.userId) {
      throw new Error("Not authorized to update this post");
    }

    await ctx.db.patch(args.postId, {
      content: args.content,
    });
  },
});

// Add reply to post
export const addReply = mutation({
  args: {
    content: v.string(),
    postId: v.id("posts"),
    authorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user is a member of the cliq
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_cliq", (q) => 
        q.eq("userId", args.authorId).eq("cliqId", post.cliqId)
      )
      .first();

    if (!membership) {
      throw new Error("Not authorized to reply in this cliq");
    }

    const replyId = await ctx.db.insert("replies", {
      content: args.content,
      createdAt: Date.now(),
      postId: args.postId,
      authorId: args.authorId,
    });

    return replyId;
  },
});

// Get replies for a post
export const getPostReplies = query({
  args: { 
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user is a member of the cliq
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_cliq", (q) => 
        q.eq("userId", args.userId).eq("cliqId", post.cliqId)
      )
      .first();

    if (!membership) {
      throw new Error("Not authorized to view replies in this cliq");
    }

    const replies = await ctx.db
      .query("replies")
      .withIndex("by_post_id", (q) => q.eq("postId", args.postId))
      .order("asc")
      .collect();

    // Get author info for each reply
    const repliesWithAuthors = await Promise.all(
      replies.map(async (reply) => {
        const author = await ctx.db.get(reply.authorId);
        const authorProfile = await ctx.db
          .query("myProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", reply.authorId))
          .first();

        const authorAccount = await ctx.db
          .query("accounts")
          .withIndex("by_user_id", (q) => q.eq("userId", reply.authorId))
          .first();

        return {
          id: reply._id,
          content: reply.content,
          createdAt: reply.createdAt,
          authorId: reply.authorId,
          author: author ? {
            id: author._id,
            email: author.email,
            profile: authorProfile ? {
              username: authorProfile.username,
              firstName: authorAccount?.firstName,
              lastName: authorAccount?.lastName,
              image: authorProfile.image,
            } : null,
          } : null,
        };
      })
    );

    return repliesWithAuthors;
  },
});

// Get all posts (for validation)
export const getAllPosts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("posts").collect();
  },
});

// Get posts for a cliq with replies (for feed)
export const getPostsForCliqFeed = query({
  args: { cliqId: v.id("cliqs") },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_cliq_id", (q) => q.eq("cliqId", args.cliqId))
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .order("desc")
      .collect();

    // Get replies for each post
    const postsWithReplies = await Promise.all(
      posts.map(async (post) => {
        const replies = await ctx.db
          .query("replies")
          .withIndex("by_post_id", (q) => q.eq("postId", post._id))
          .order("asc")
          .collect();

        // Get author info for replies
        const repliesWithAuthors = await Promise.all(
          replies.map(async (reply) => {
            const author = await ctx.db.get(reply.authorId);
            const profile = author ? await ctx.db
              .query("myProfiles")
              .withIndex("by_user_id", (q) => q.eq("userId", author._id))
              .first() : null;

            return {
              ...reply,
              author: {
                id: author?._id,
                email: author?.email,
                myProfile: profile ? {
                  username: profile.username,
                  image: profile.image,
                } : null,
              },
            };
          })
        );

        // Get author info for post
        const author = await ctx.db.get(post.authorId);
        const profile = author ? await ctx.db
          .query("myProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", author._id))
          .first() : null;

        return {
          ...post,
          replies: repliesWithAuthors,
          author: {
            id: author?._id,
            email: author?.email,
            myProfile: profile ? {
              username: profile.username,
              image: profile.image,
            } : null,
          },
        };
      })
    );

    return postsWithReplies;
  },
});

// Suspend a specific post (Red Alert)
export const suspendPost = mutation({
  args: {
    postId: v.id("posts"),
    redAlertId: v.id("redAlerts"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    await ctx.db.patch(args.postId, {
      moderationStatus: "suspended",
      suspendedAt: Date.now(),
      redAlertTriggered: true,
      redAlertId: args.redAlertId,
      suspensionReason: args.reason,
    });

    return args.postId;
  },
});

// Suspend all content from a user in a specific cliq (Red Alert)
export const suspendUserContent = mutation({
  args: {
    userId: v.id("users"),
    cliqId: v.id("cliqs"),
    redAlertId: v.id("redAlerts"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_cliq_id", (q) => q.eq("cliqId", args.cliqId))
      .filter((q) => q.eq(q.field("authorId"), args.userId))
      .collect();

    let suspendedCount = 0;
    for (const post of posts) {
      await ctx.db.patch(post._id, {
        moderationStatus: "suspended",
        suspendedAt: Date.now(),
        redAlertTriggered: true,
        redAlertId: args.redAlertId,
        suspensionReason: args.reason,
      });
      suspendedCount++;
    }

    return suspendedCount;
  },
});

// Suspend content from a time range in a cliq (Red Alert)
export const suspendContentByTimeRange = mutation({
  args: {
    cliqId: v.id("cliqs"),
    startTime: v.number(),
    endTime: v.number(),
    redAlertId: v.id("redAlerts"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_cliq_id", (q) => q.eq("cliqId", args.cliqId))
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), args.startTime),
          q.lte(q.field("createdAt"), args.endTime)
        )
      )
      .collect();

    let suspendedCount = 0;
    for (const post of posts) {
      await ctx.db.patch(post._id, {
        moderationStatus: "suspended",
        suspendedAt: Date.now(),
        redAlertTriggered: true,
        redAlertId: args.redAlertId,
        suspensionReason: args.reason,
      });
      suspendedCount++;
    }

    return suspendedCount;
  },
});

// Restore suspended content (for moderation review)
export const restorePost = mutation({
  args: {
    postId: v.id("posts"),
    restoredBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    await ctx.db.patch(args.postId, {
      moderationStatus: "approved",
      suspendedAt: undefined,
      suspendedBy: undefined,
      suspensionReason: undefined,
      redAlertTriggered: false,
      redAlertId: undefined,
    });

    return args.postId;
  },
});

// Get posts for parent monitoring (bypasses membership checks for parents)
export const getPostsForParentMonitoring = query({
  args: { 
    cliqId: v.id("cliqs"),
    parentId: v.id("users"),
    childId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify parent-child relationship
    const parentLink = await ctx.db
      .query("parentLinks")
      .withIndex("by_parent_child", (q) => 
        q.eq("parentId", args.parentId).eq("childId", args.childId)
      )
      .first();

    if (!parentLink) {
      throw new Error("Not authorized to monitor this child");
    }

    // Verify child is a member of this cliq
    const childMembership = await ctx.db
      .query("memberships")
      .withIndex("by_user_cliq", (q) => 
        q.eq("userId", args.childId).eq("cliqId", args.cliqId)
      )
      .first();

    if (!childMembership) {
      throw new Error("Child is not a member of this cliq");
    }

    // Get all posts from this cliq (parent can see everything)
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_cliq_id", (q) => q.eq("cliqId", args.cliqId))
      .filter((q) => q.eq(q.field("deleted"), false))
      .order("desc")
      .collect();

    // Get replies for each post
    const postsWithReplies = await Promise.all(
      posts.map(async (post) => {
        const replies = await ctx.db
          .query("replies")
          .withIndex("by_post_id", (q) => q.eq("postId", post._id))
          .order("asc")
          .collect();

        // Get author info for replies
        const repliesWithAuthors = await Promise.all(
          replies.map(async (reply) => {
            const author = await ctx.db.get(reply.authorId);
            const account = author ? await ctx.db
              .query("accounts")
              .withIndex("by_user_id", (q) => q.eq("userId", author._id))
              .first() : null;
            const profile = author ? await ctx.db
              .query("myProfiles")
              .withIndex("by_user_id", (q) => q.eq("userId", author._id))
              .first() : null;

            return {
              ...reply,
              author: {
                id: author?._id,
                email: author?.email,
                account: account ? {
                  firstName: account.firstName,
                  lastName: account.lastName,
                } : null,
                profile: profile ? {
                  username: profile.username,
                  image: profile.image,
                } : null,
              },
            };
          })
        );

        // Get author info for post
        const author = await ctx.db.get(post.authorId);
        const account = author ? await ctx.db
          .query("accounts")
          .withIndex("by_user_id", (q) => q.eq("userId", author._id))
          .first() : null;
        const profile = author ? await ctx.db
          .query("myProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", author._id))
          .first() : null;

        return {
          ...post,
          id: post._id,
          replies: repliesWithAuthors,
          author: {
            id: author?._id,
            email: author?.email,
            account: account ? {
              firstName: account.firstName,
              lastName: account.lastName,
            } : null,
            profile: profile ? {
              username: profile.username,
              image: profile.image,
            } : null,
          },
        };
      })
    );

    return postsWithReplies;
  },
});

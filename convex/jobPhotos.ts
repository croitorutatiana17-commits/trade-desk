import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * List photos for a specific job.
 */
export const listForJob = query({
  args: { jobId: v.id("jobs") },
  returns: v.array(
    v.object({
      _id: v.id("jobPhotos"),
      _creationTime: v.number(),
      userId: v.id("users"),
      jobId: v.id("jobs"),
      storageId: v.id("_storage"),
      label: v.optional(v.string()),
      caption: v.optional(v.string()),
      url: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const photos = await ctx.db
      .query("jobPhotos")
      .withIndex("jobId", (q) => q.eq("jobId", args.jobId))
      .collect();

    // Verify ownership
    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== userId) return [];

    return await Promise.all(
      photos.map(async (photo) => ({
        ...photo,
        url: (await ctx.storage.getUrl(photo.storageId)) ?? undefined,
      })),
    );
  },
});

/**
 * Add a photo to a job.
 */
export const add = mutation({
  args: {
    jobId: v.id("jobs"),
    storageId: v.id("_storage"),
    label: v.optional(v.union(v.literal("before"), v.literal("after"))),
    caption: v.optional(v.string()),
  },
  returns: v.id("jobPhotos"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== userId) throw new Error("Not found");

    // Check limit (max 10 photos per job)
    const existingPhotos = await ctx.db
      .query("jobPhotos")
      .withIndex("jobId", (q) => q.eq("jobId", args.jobId))
      .collect();

    if (existingPhotos.length >= 10) {
      throw new Error("Maximum 10 photos per job");
    }

    return await ctx.db.insert("jobPhotos", {
      userId,
      jobId: args.jobId,
      storageId: args.storageId,
      label: args.label,
      caption: args.caption,
    });
  },
});

/**
 * Delete a photo.
 */
export const remove = mutation({
  args: { photoId: v.id("jobPhotos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const photo = await ctx.db.get(args.photoId);
    if (!photo || photo.userId !== userId) throw new Error("Not found");

    await ctx.storage.delete(photo.storageId);
    await ctx.db.delete(args.photoId);
    return null;
  },
});
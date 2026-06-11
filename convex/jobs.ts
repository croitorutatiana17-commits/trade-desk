import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const jobStatuses = v.union(
  v.literal("scheduled"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled"),
);

/**
 * List jobs for the current user with optional status filter.
 */
export const list = query({
  args: {
    status: v.optional(jobStatuses),
    customerId: v.optional(v.id("customers")),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("jobs"),
      _creationTime: v.number(),
      userId: v.id("users"),
      customerId: v.id("customers"),
      title: v.string(),
      description: v.optional(v.string()),
      address: v.optional(v.string()),
      jobType: v.optional(v.string()),
      scheduledDate: v.optional(v.number()),
      scheduledTime: v.optional(v.string()),
      status: v.string(),
      internalNotes: v.optional(v.string()),
      totalAmount: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    let queryBuilder;

    if (args.status) {
      queryBuilder = ctx.db
        .query("jobs")
        .withIndex("userId_status", (q) =>
          q.eq("userId", userId).eq("status", args.status!)
        )
        .order("desc");
    } else if (args.customerId) {
      queryBuilder = ctx.db
        .query("jobs")
        .withIndex("userId_customerId", (q) =>
          q.eq("userId", userId).eq("customerId", args.customerId!)
        )
        .order("desc");
    } else {
      queryBuilder = ctx.db
        .query("jobs")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .order("desc");
    }

    if (args.limit) {
      return await queryBuilder.take(args.limit);
    }
    return await queryBuilder.collect();
  },
});

/**
 * Get a single job by ID.
 */
export const get = query({
  args: { jobId: v.id("jobs") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("jobs"),
      _creationTime: v.number(),
      userId: v.id("users"),
      customerId: v.id("customers"),
      title: v.string(),
      description: v.optional(v.string()),
      address: v.optional(v.string()),
      jobType: v.optional(v.string()),
      scheduledDate: v.optional(v.number()),
      scheduledTime: v.optional(v.string()),
      status: v.string(),
      internalNotes: v.optional(v.string()),
      totalAmount: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== userId) return null;
    return job;
  },
});

/**
 * Create a new job.
 */
export const create = mutation({
  args: {
    customerId: v.id("customers"),
    title: v.string(),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    jobType: v.optional(v.string()),
    scheduledDate: v.optional(v.number()),
    scheduledTime: v.optional(v.string()),
    status: jobStatuses,
    internalNotes: v.optional(v.string()),
  },
  returns: v.id("jobs"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    return await ctx.db.insert("jobs", {
      userId,
      customerId: args.customerId,
      title: args.title,
      description: args.description,
      address: args.address,
      jobType: args.jobType,
      scheduledDate: args.scheduledDate,
      scheduledTime: args.scheduledTime,
      status: args.status,
      internalNotes: args.internalNotes,
    });
  },
});

/**
 * Update a job.
 */
export const update = mutation({
  args: {
    jobId: v.id("jobs"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    jobType: v.optional(v.string()),
    scheduledDate: v.optional(v.number()),
    scheduledTime: v.optional(v.string()),
    status: v.optional(jobStatuses),
    internalNotes: v.optional(v.string()),
    totalAmount: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== userId) throw new Error("Not found");

    const patch: Record<string, any> = {};
    if (args.title !== undefined) patch.title = args.title;
    if (args.description !== undefined) patch.description = args.description;
    if (args.address !== undefined) patch.address = args.address;
    if (args.jobType !== undefined) patch.jobType = args.jobType;
    if (args.scheduledDate !== undefined) patch.scheduledDate = args.scheduledDate;
    if (args.scheduledTime !== undefined) patch.scheduledTime = args.scheduledTime;
    if (args.status !== undefined) patch.status = args.status;
    if (args.internalNotes !== undefined) patch.internalNotes = args.internalNotes;
    if (args.totalAmount !== undefined) patch.totalAmount = args.totalAmount;

    await ctx.db.patch(args.jobId, patch);
    return null;
  },
});

/**
 * Delete a job.
 */
export const remove = mutation({
  args: { jobId: v.id("jobs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== userId) throw new Error("Not found");

    await ctx.db.delete(args.jobId);
    return null;
  },
});

/**
 * Get dashboard stats.
 */
export const dashboardStats = query({
  args: {},
  returns: v.object({
    todaysJobs: v.number(),
    outstandingInvoices: v.number(),
    outstandingTotal: v.number(),
    jobsThisMonth: v.number(),
    revenueThisMonth: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Today's jobs
    const todaysJobs = await ctx.db
      .query("jobs")
      .withIndex("userId_scheduledDate", (q) =>
        q.eq("userId", userId).eq("scheduledDate", startOfDay.getTime())
      )
      .collect()
      .then((jobs) => {
        // Also check for jobs where scheduledDate is within today
        return jobs.filter(
          (j) => j.scheduledDate && j.scheduledDate >= startOfDay.getTime() && j.scheduledDate <= endOfDay.getTime()
        ).length;
      });

    // Actually let's count differently - jobs with scheduledDate in range
    const allJobsToday = await ctx.db
      .query("jobs")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    const todaysJobsCount = allJobsToday.filter(
      (j) => j.scheduledDate && j.scheduledDate >= startOfDay.getTime() && j.scheduledDate <= endOfDay.getTime()
    ).length;

    const jobsThisMonth = allJobsToday.filter(
      (j) => j.scheduledDate && j.scheduledDate >= startOfMonth.getTime()
    ).length;

    // Invoices
    const allInvoices = await ctx.db
      .query("invoices")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    const outstandingInvoices = allInvoices.filter(
      (inv) => inv.status === "sent" || inv.status === "overdue"
    ).length;
    const outstandingTotal = allInvoices
      .filter((inv) => inv.status === "sent" || inv.status === "overdue")
      .reduce((sum, inv) => sum + inv.total, 0);

    const revenueThisMonth = allInvoices
      .filter(
        (inv) =>
          inv.status === "paid" &&
          inv.paidAt &&
          inv.paidAt >= startOfMonth.getTime()
      )
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      todaysJobs: todaysJobsCount,
      outstandingInvoices,
      outstandingTotal,
      jobsThisMonth,
      revenueThisMonth,
    };
  },
});
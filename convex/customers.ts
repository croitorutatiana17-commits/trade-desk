import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * List all customers for the current user.
 */
export const list = query({
  args: { search: v.optional(v.string()) },
  returns: v.array(
    v.object({
      _id: v.id("customers"),
      _creationTime: v.number(),
      userId: v.id("users"),
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      notes: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    if (args.search) {
      const searchTerm = args.search.toLowerCase();
      const customers = await ctx.db
        .query("customers")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();
      return customers.filter((c) =>
        c.name.toLowerCase().includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm)) ||
        (c.phone && c.phone.includes(searchTerm))
      );
    }

    return await ctx.db
      .query("customers")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/**
 * Get a single customer by ID.
 */
export const get = query({
  args: { customerId: v.id("customers") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("customers"),
      _creationTime: v.number(),
      userId: v.id("users"),
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      notes: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.userId !== userId) return null;
    return customer;
  },
});

/**
 * Create a new customer.
 */
export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("customers"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    return await ctx.db.insert("customers", {
      userId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      address: args.address,
      notes: args.notes,
    });
  },
});

/**
 * Update a customer.
 */
export const update = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.userId !== userId) throw new Error("Not found");

    const patch: Record<string, any> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.email !== undefined) patch.email = args.email;
    if (args.phone !== undefined) patch.phone = args.phone;
    if (args.address !== undefined) patch.address = args.address;
    if (args.notes !== undefined) patch.notes = args.notes;

    await ctx.db.patch(args.customerId, patch);
    return null;
  },
});

/**
 * Delete a customer.
 */
export const remove = mutation({
  args: { customerId: v.id("customers") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.userId !== userId) throw new Error("Not found");

    await ctx.db.delete(args.customerId);
    return null;
  },
});

/**
 * Find or create a customer by name.
 */
export const findOrCreate = mutation({
  args: { name: v.string() },
  returns: v.id("customers"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("customers")
      .withIndex("userId_name", (q) => q.eq("userId", userId).eq("name", args.name))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("customers", {
      userId,
      name: args.name,
    });
  },
});
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * List invoices for the current user.
 */
export const list = query({
  args: {
    status: v.optional(v.string()),
    customerId: v.optional(v.id("customers")),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("invoices"),
      _creationTime: v.number(),
      userId: v.id("users"),
      customerId: v.id("customers"),
      jobId: v.optional(v.id("jobs")),
      invoiceNumber: v.string(),
      status: v.string(),
      issueDate: v.number(),
      dueDate: v.number(),
      subtotal: v.number(),
      taxRate: v.number(),
      taxAmount: v.number(),
      total: v.number(),
      notes: v.optional(v.string()),
      paidAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    let queryBuilder;

    if (args.status) {
      queryBuilder = ctx.db
        .query("invoices")
        .withIndex("userId_status", (q) =>
          q.eq("userId", userId).eq("status", args.status!)
        )
        .order("desc");
    } else if (args.customerId) {
      queryBuilder = ctx.db
        .query("invoices")
        .withIndex("userId_customerId", (q) =>
          q.eq("userId", userId).eq("customerId", args.customerId!)
        )
        .order("desc");
    } else {
      queryBuilder = ctx.db
        .query("invoices")
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
 * Get a single invoice with line items.
 */
export const getWithLineItems = query({
  args: { invoiceId: v.id("invoices") },
  returns: v.union(
    v.null(),
    v.object({
      invoice: v.object({
        _id: v.id("invoices"),
        _creationTime: v.number(),
        userId: v.id("users"),
        customerId: v.id("customers"),
        jobId: v.optional(v.id("jobs")),
        invoiceNumber: v.string(),
        status: v.string(),
        issueDate: v.number(),
        dueDate: v.number(),
        subtotal: v.number(),
        taxRate: v.number(),
        taxAmount: v.number(),
        total: v.number(),
        notes: v.optional(v.string()),
        paidAt: v.optional(v.number()),
      }),
      lineItems: v.array(
        v.object({
          _id: v.id("invoiceLineItems"),
          _creationTime: v.number(),
          userId: v.id("users"),
          invoiceId: v.id("invoices"),
          description: v.string(),
          quantity: v.number(),
          unitPrice: v.number(),
          total: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.userId !== userId) return null;

    const lineItems = await ctx.db
      .query("invoiceLineItems")
      .withIndex("invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    return { invoice, lineItems };
  },
});

/**
 * Create an invoice.
 */
export const create = mutation({
  args: {
    customerId: v.id("customers"),
    jobId: v.optional(v.id("jobs")),
    issueDate: v.number(),
    dueDate: v.number(),
    taxRate: v.number(),
    notes: v.optional(v.string()),
    lineItems: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
      }),
    ),
  },
  returns: v.id("invoices"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // Generate invoice number
    const existingInvoices = await ctx.db
      .query("invoices")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    const nextNumber = existingInvoices.length + 1;
    const invoiceNumber = `INV-${String(nextNumber).padStart(4, "0")}`;

    // Calculate totals
    const subtotal = args.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const taxAmount = subtotal * (args.taxRate / 100);
    const total = subtotal + taxAmount;

    const invoiceId = await ctx.db.insert("invoices", {
      userId,
      customerId: args.customerId,
      jobId: args.jobId,
      invoiceNumber,
      status: "draft",
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      subtotal,
      taxRate: args.taxRate,
      taxAmount,
      total,
      notes: args.notes,
    });

    // Create line items
    for (const item of args.lineItems) {
      await ctx.db.insert("invoiceLineItems", {
        userId,
        invoiceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      });
    }

    return invoiceId;
  },
});

/**
 * Update invoice status.
 */
export const updateStatus = mutation({
  args: {
    invoiceId: v.id("invoices"),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.userId !== userId) throw new Error("Not found");

    const patch: Record<string, any> = { status: args.status };
    if (args.status === "paid") {
      patch.paidAt = Date.now();
    }

    await ctx.db.patch(args.invoiceId, patch);
    return null;
  },
});

/**
 * Delete an invoice.
 */
export const remove = mutation({
  args: { invoiceId: v.id("invoices") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.userId !== userId) throw new Error("Not found");

    // Delete line items
    const lineItems = await ctx.db
      .query("invoiceLineItems")
      .withIndex("invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    for (const item of lineItems) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.invoiceId);
    return null;
  },
});
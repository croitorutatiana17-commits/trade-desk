import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get the currently authenticated user with their profile.
 */
export const currentUser = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      businessName: v.optional(v.string()),
      tradeType: v.optional(v.string()),
      businessPhone: v.optional(v.string()),
      logoStorageId: v.optional(v.id("_storage")),
      onboardingComplete: v.optional(v.boolean()),
      defaultTaxRate: v.optional(v.number()),
      paymentTerms: v.optional(v.string()),
      invoiceNotesPrefix: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      subscriptionStatus: v.optional(v.string()),
      subscriptionEndDate: v.optional(v.number()),
      trialEndDate: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});

/**
 * Complete onboarding step 1: business name and trade type.
 */
export const completeOnboardingStep1 = mutation({
  args: {
    businessName: v.string(),
    tradeType: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    await ctx.db.patch(userId, {
      businessName: args.businessName,
      tradeType: args.tradeType,
    });
    return null;
  },
});

/**
 * Complete onboarding step 2: phone and optional logo.
 */
export const completeOnboardingStep2 = mutation({
  args: {
    businessPhone: v.string(),
    logoStorageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    await ctx.db.patch(userId, {
      businessPhone: args.businessPhone,
      logoStorageId: args.logoStorageId,
      onboardingComplete: true,
      trialEndDate: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days from now
    });
    return null;
  },
});

/**
 * Generate a URL for uploading files (logos, photos).
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Update user profile (settings).
 */
export const updateProfile = mutation({
  args: {
    businessName: v.optional(v.string()),
    tradeType: v.optional(v.string()),
    businessPhone: v.optional(v.string()),
    phone: v.optional(v.string()),
    defaultTaxRate: v.optional(v.number()),
    paymentTerms: v.optional(v.string()),
    invoiceNotesPrefix: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const patch: Record<string, any> = {};
    if (args.businessName !== undefined) patch.businessName = args.businessName;
    if (args.tradeType !== undefined) patch.tradeType = args.tradeType;
    if (args.businessPhone !== undefined) patch.businessPhone = args.businessPhone;
    if (args.phone !== undefined) patch.phone = args.phone;
    if (args.defaultTaxRate !== undefined) patch.defaultTaxRate = args.defaultTaxRate;
    if (args.paymentTerms !== undefined) patch.paymentTerms = args.paymentTerms;
    if (args.invoiceNotesPrefix !== undefined) patch.invoiceNotesPrefix = args.invoiceNotesPrefix;

    await ctx.db.patch(userId, patch);
    return null;
  },
});

/**
 * Update user logo.
 */
export const updateLogo = mutation({
  args: {
    logoStorageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { logoStorageId: args.logoStorageId });
    return null;
  },
});
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Business profile fields
    businessName: v.optional(v.string()),
    tradeType: v.optional(v.string()),
    businessPhone: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    // Onboarding status
    onboardingComplete: v.optional(v.boolean()),
    // Invoice defaults
    defaultTaxRate: v.optional(v.number()),
    paymentTerms: v.optional(v.string()),
    invoiceNotesPrefix: v.optional(v.string()),
    // Subscription
    stripeCustomerId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    subscriptionEndDate: v.optional(v.number()),
    trialEndDate: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("stripeCustomerId", ["stripeCustomerId"]),

  customers: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("userId_name", ["userId", "name"]),

  jobs: defineTable({
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
  })
    .index("userId", ["userId"])
    .index("userId_status", ["userId", "status"])
    .index("userId_customerId", ["userId", "customerId"])
    .index("userId_scheduledDate", ["userId", "scheduledDate"]),

  jobPhotos: defineTable({
    userId: v.id("users"),
    jobId: v.id("jobs"),
    storageId: v.id("_storage"),
    label: v.optional(v.union(v.literal("before"), v.literal("after"))),
    caption: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("jobId", ["jobId"]),

  invoices: defineTable({
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
  })
    .index("userId", ["userId"])
    .index("userId_status", ["userId", "status"])
    .index("userId_customerId", ["userId", "customerId"])
    .index("userId_invoiceNumber", ["userId", "invoiceNumber"]),

  invoiceLineItems: defineTable({
    userId: v.id("users"),
    invoiceId: v.id("invoices"),
    description: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    total: v.number(),
  })
    .index("userId", ["userId"])
    .index("invoiceId", ["invoiceId"]),
});
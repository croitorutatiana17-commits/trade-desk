"use node";
import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";
import { internal } from "./_generated/api";

// Creates a Stripe Checkout session and returns the URL
export const createCheckoutSession = action({
  args: {
    userEmail: v.string(),
    userId: v.string(), // Supabase user ID stored as metadata
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    const priceId = process.env.STRIPE_PRICE_ID as string;

    // Create or retrieve a Stripe customer keyed by email
    const existing = await stripe.customers.list({ email: args.userEmail, limit: 1 });
    let customer: Stripe.Customer;
    if (existing.data.length > 0) {
      customer = existing.data[0];
    } else {
      customer = await stripe.customers.create({
        email: args.userEmail,
        metadata: { supabaseUserId: args.userId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: args.successUrl + "?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: args.cancelUrl,
      metadata: { supabaseUserId: args.userId },
      allow_promotion_codes: true,
    });

    if (!session.url) throw new Error("No checkout URL returned by Stripe");
    return session.url;
  },
});

// Verifies a completed Stripe session and returns subscription status
export const verifyCheckoutSession = action({
  args: {
    sessionId: v.string(),
    userId: v.string(),
  },
  returns: v.object({
    status: v.string(),
    customerId: v.string(),
    subscriptionId: v.string(),
    currentPeriodEnd: v.number(),
  }),
  handler: async (_ctx, args) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    const session = await stripe.checkout.sessions.retrieve(args.sessionId, {
      expand: ["subscription"],
    });

    if (session.payment_status !== "paid" && session.status !== "complete") {
      throw new Error("Payment not completed");
    }

    const sub = session.subscription as Stripe.Subscription;
    return {
      status: sub.status,
      customerId: session.customer as string,
      subscriptionId: sub.id,
      currentPeriodEnd: (sub as any).current_period_end * 1000,
    };
  },
});

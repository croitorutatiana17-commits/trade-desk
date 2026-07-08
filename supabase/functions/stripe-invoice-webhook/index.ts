// Supabase Edge Function: stripe-invoice-webhook
// Verifies Stripe webhook signatures and marks invoices paid only after
// Stripe confirms payment.
// Deploy: supabase functions deploy stripe-invoice-webhook --no-verify-jwt
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { receiptEmail, sendEmail } from '../_shared/invoice-email.ts'

const jsonHeaders = { 'Content-Type': 'application/json' }

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  })
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} is not set in Supabase secrets`)
  return value
}

function normalizeProjectUrl(value: string) {
  return new URL(value).origin
}

function getSupabaseUrl() {
  const value = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('PROJECT_URL')
  if (!value) {
    throw new Error('SUPABASE_URL or PROJECT_URL is not set in Supabase secrets')
  }
  return normalizeProjectUrl(value)
}

function getServiceRoleKey() {
  const value = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY')
  if (!value) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY is not set in Supabase secrets')
  }
  return value
}

function getAppUrl() {
  const value = Deno.env.get('APP_URL')
  if (!value) throw new Error('APP_URL is not set in Supabase secrets')
  return value.replace(/\/$/, '')
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null
}

function subscriptionCustomerId(subscription: Stripe.Subscription, fallback: unknown) {
  if (typeof subscription.customer === 'string') return subscription.customer
  if (subscription.customer?.id) return subscription.customer.id
  return typeof fallback === 'string' ? fallback : null
}

async function upsertUserSubscription(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  subscription: Stripe.Subscription,
  fallbackCustomer: unknown,
) {
  const { error } = await supabase.from('user_subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: subscriptionCustomerId(subscription, fallbackCustomer),
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    current_period_end: subscriptionPeriodEnd(subscription),
  }, { onConflict: 'user_id' })

  if (error) throw new Error(error.message)
}

async function userIdForSubscription(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription,
) {
  const metadataUserId = subscription.metadata?.supabaseUserId
  if (metadataUserId) return metadataUserId

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data?.user_id as string | undefined
}

async function sendReceiptEmail(supabase: ReturnType<typeof createClient>, invoiceId: string) {
  const { data: invoice, error: invoiceErr } = await supabase
    .from('invoices')
    .select('id, user_id, invoice_number, share_token, total, due_date, paid_at, receipt_sent_at, customers(name, email)')
    .eq('id', invoiceId)
    .single()

  if (invoiceErr || !invoice) {
    throw new Error(invoiceErr?.message ?? 'Invoice not found for receipt email')
  }

  if (invoice.receipt_sent_at) {
    return { skipped: true, reason: 'Receipt already sent' }
  }

  const customer = Array.isArray(invoice.customers)
    ? invoice.customers[0]
    : invoice.customers

  if (!customer?.email) {
    return { skipped: true, reason: 'Customer email is missing' }
  }

  const invoiceUrl = `${getAppUrl()}/invoice/${invoice.share_token}`
  const email = receiptEmail({
    invoiceNumber: invoice.invoice_number,
    amount: Number(invoice.total),
    dueDate: invoice.due_date,
    paidAt: invoice.paid_at,
    customer,
    invoiceUrl,
  })

  try {
    const result = await sendEmail({
      to: customer.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })

    const sentAt = new Date().toISOString()

    await supabase.from('invoice_email_events').insert({
      invoice_id: invoice.id,
      user_id: invoice.user_id,
      customer_email: customer.email,
      email_type: 'receipt',
      status: 'sent',
      resend_email_id: result.id ?? null,
    })

    await supabase
      .from('invoices')
      .update({ receipt_sent_at: sentAt })
      .eq('id', invoice.id)
      .is('receipt_sent_at', null)

    return { sent: true, emailId: result.id ?? null }
  } catch (err) {
    await supabase.from('invoice_email_events').insert({
      invoice_id: invoice.id,
      user_id: invoice.user_id,
      customer_email: customer.email,
      email_type: 'receipt',
      status: 'failed',
      error_message: (err as Error).message,
    })

    return { sent: false, error: (err as Error).message }
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const stripeKey = getRequiredEnv('STRIPE_SECRET_KEY')
    const webhookSecret = getRequiredEnv('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = getSupabaseUrl()
    const serviceRoleKey = getServiceRoleKey()

    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return json({ error: 'Missing Stripe-Signature header' }, 400)
    }

    const rawBody = await req.text()
    const stripe = new Stripe(stripeKey)
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
    )

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.mode === 'subscription') {
        const userId = session.metadata?.supabaseUserId
        if (!userId) {
          return json({ received: true, ignored: 'subscription checkout missing user metadata' })
        }

        const subscription = typeof session.subscription === 'string'
          ? await stripe.subscriptions.retrieve(session.subscription)
          : session.subscription as Stripe.Subscription | null

        if (!subscription?.id) {
          return json({ error: 'Subscription missing from checkout session' }, 400)
        }

        await upsertUserSubscription(supabase, userId, subscription, session.customer)
        return json({ received: true, status: 'subscription_updated' })
      }

      if (session.mode !== 'payment') {
        return json({ received: true, ignored: session.mode ?? 'unknown checkout mode' })
      }

      const invoiceId = session.metadata?.invoiceId
      const userId = session.metadata?.userId

      if (!invoiceId || !userId) {
        return json({ received: true, ignored: 'payment checkout missing invoice metadata' })
      }

      if (session.payment_status !== 'paid') {
        await supabase.from('invoice_payments').upsert({
          invoice_id: invoiceId,
          user_id: userId,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
          stripe_event_id: event.id,
          amount: (session.amount_total ?? 0) / 100,
          currency: session.currency ?? 'usd',
          status: 'processing',
          raw_event: event as unknown as Record<string, unknown>,
        }, { onConflict: 'stripe_checkout_session_id' })

        return json({ received: true, status: 'processing' })
      }

      const paidAt = new Date((event.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString()
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null

      const { error: paymentErr } = await supabase.from('invoice_payments').upsert({
        invoice_id: invoiceId,
        user_id: userId,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        stripe_event_id: event.id,
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency ?? 'usd',
        status: 'paid',
        paid_at: paidAt,
        raw_event: event as unknown as Record<string, unknown>,
      }, { onConflict: 'stripe_checkout_session_id' })

      if (paymentErr) {
        return json({ error: paymentErr.message }, 500)
      }

      const { error: invoiceErr } = await supabase
        .from('invoices')
        .update({ status: 'paid', paid_at: paidAt })
        .eq('id', invoiceId)
        .neq('status', 'paid')

      if (invoiceErr) {
        return json({ error: invoiceErr.message }, 500)
      }

      let receipt: Record<string, unknown>
      try {
        receipt = await sendReceiptEmail(supabase, invoiceId)
      } catch (err) {
        receipt = { sent: false, error: (err as Error).message }
      }

      return json({ received: true, status: 'paid', receipt })
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      const userId = await userIdForSubscription(supabase, subscription)

      if (!userId) {
        return json({ received: true, ignored: 'subscription missing user metadata' })
      }

      await upsertUserSubscription(supabase, userId, subscription, subscription.customer)
      return json({ received: true, status: 'subscription_updated' })
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session
      const invoiceId = session.metadata?.invoiceId
      const userId = session.metadata?.userId

      if (invoiceId && userId) {
        await supabase.from('invoice_payments').upsert({
          invoice_id: invoiceId,
          user_id: userId,
          stripe_checkout_session_id: session.id,
          stripe_event_id: event.id,
          amount: (session.amount_total ?? 0) / 100,
          currency: session.currency ?? 'usd',
          status: 'cancelled',
          raw_event: event as unknown as Record<string, unknown>,
        }, { onConflict: 'stripe_checkout_session_id' })
      }

      return json({ received: true, status: 'cancelled' })
    }

    return json({ received: true, ignored: event.type })
  } catch (err) {
    return json({ error: (err as Error).message }, 400)
  }
})

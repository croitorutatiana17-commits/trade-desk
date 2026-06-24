// Supabase Edge Function: stripe-invoice-webhook
// Verifies Stripe webhook signatures and marks invoices paid only after
// Stripe confirms payment.
// Deploy: supabase functions deploy stripe-invoice-webhook --no-verify-jwt
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const stripeKey = getRequiredEnv('STRIPE_SECRET_KEY')
    const webhookSecret = getRequiredEnv('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')

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
      const invoiceId = session.metadata?.invoiceId
      const userId = session.metadata?.userId

      if (!invoiceId || !userId) {
        return json({ error: 'Missing invoice metadata' }, 400)
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

      return json({ received: true, status: 'paid' })
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

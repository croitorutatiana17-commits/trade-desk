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

function getSupabaseUrl() {
  const value = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('PROJECT_URL')
  if (!value) {
    throw new Error('SUPABASE_URL or PROJECT_URL is not set in Supabase secrets')
  }
  return value
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

      let receipt: Record<string, unknown>
      try {
        receipt = await sendReceiptEmail(supabase, invoiceId)
      } catch (err) {
        receipt = { sent: false, error: (err as Error).message }
      }

      return json({ received: true, status: 'paid', receipt })
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

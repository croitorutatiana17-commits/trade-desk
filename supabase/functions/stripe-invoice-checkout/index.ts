// Supabase Edge Function: stripe-invoice-checkout
// Creates a one-time Stripe Checkout session for a public invoice link.
// Deploy: supabase functions deploy stripe-invoice-checkout --no-verify-jwt
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function getAppUrl(req: Request) {
  const configured = Deno.env.get('APP_URL')
  if (configured) return configured.replace(/\/$/, '')

  const origin = req.headers.get('origin')
  if (origin) return origin.replace(/\/$/, '')

  throw new Error('APP_URL is not set and request origin is missing')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('PROJECT_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY')

    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set in Supabase secrets')
    if (!supabaseUrl) throw new Error('SUPABASE_URL or PROJECT_URL is not set in Supabase secrets')
    if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY is not set in Supabase secrets')

    const { shareToken } = await req.json()
    if (!shareToken || typeof shareToken !== 'string') {
      return json({ error: 'shareToken is required' }, 400)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: invoice, error: invoiceErr } = await supabase
      .from('invoices')
      .select('id, user_id, invoice_number, status, total, customer_id, customers(name, email)')
      .eq('share_token', shareToken)
      .single()

    if (invoiceErr || !invoice) {
      return json({ error: 'Invoice not found' }, 404)
    }

    if (invoice.status === 'paid') {
      return json({ error: 'Invoice is already paid' }, 409)
    }

    const amount = Number(invoice.total)
    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ error: 'Invoice total must be greater than zero' }, 400)
    }

    const unitAmount = Math.round(amount * 100)
    const customer = Array.isArray(invoice.customers)
      ? invoice.customers[0]
      : invoice.customers

    const appUrl = getAppUrl(req)
    const publicInvoiceUrl = `${appUrl}/invoice/${shareToken}`

    const metadata = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      shareToken,
      userId: invoice.user_id,
    }

    const stripe = new Stripe(stripeKey)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customer?.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: customer?.name ? `Payment for ${customer.name}` : undefined,
            },
          },
        },
      ],
      success_url: `${publicInvoiceUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicInvoiceUrl}?payment=cancelled`,
      metadata,
      payment_intent_data: { metadata },
    })

    const { error: paymentErr } = await supabase.from('invoice_payments').insert({
      invoice_id: invoice.id,
      user_id: invoice.user_id,
      stripe_checkout_session_id: session.id,
      amount,
      currency: 'usd',
      status: 'checkout_created',
    })

    if (paymentErr) {
      return json({ error: `Checkout created but payment record failed: ${paymentErr.message}` }, 500)
    }

    return json({ url: session.url, sessionId: session.id })
  } catch (err) {
    return json({ error: (err as Error).message }, 400)
  }
})

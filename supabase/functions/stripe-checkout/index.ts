// Supabase Edge Function: stripe-checkout
// Creates a Stripe Checkout session and returns the URL
// Deploy: supabase functions deploy stripe-checkout --no-verify-jwt
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

function normalizeProjectUrl(value: string) {
  return new URL(value).origin
}

function getSupabaseUrl() {
  const value = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('PROJECT_URL')
  if (!value) throw new Error('SUPABASE_URL or PROJECT_URL is not set in Supabase secrets')
  return normalizeProjectUrl(value)
}

function getServiceRoleKey() {
  const value = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY')
  if (!value) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY is not set in Supabase secrets')
  }
  return value
}

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (!token) throw new Error('Missing Authorization bearer token')

  const supabase = createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw new Error('Invalid or expired session')
  return data.user
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
    const priceId = Deno.env.get('STRIPE_PRICE_ID')

    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set in Supabase secrets')
    if (!priceId) throw new Error('STRIPE_PRICE_ID is not set in Supabase secrets')

    const stripe = new Stripe(stripeKey)
    const user = await getAuthenticatedUser(req)
    const { successUrl, cancelUrl } = await req.json()

    if (!successUrl || !cancelUrl) {
      return json({ error: 'successUrl and cancelUrl are required' }, 400)
    }

    const userEmail = user.email
    const existing = userEmail
      ? await stripe.customers.list({ email: userEmail, limit: 1 })
      : { data: [] as Stripe.Customer[] }
    const customer = existing.data.length > 0
      ? existing.data[0]
      : await stripe.customers.create({
          email: userEmail,
          metadata: { supabaseUserId: user.id },
        })

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: { supabaseUserId: user.id },
      subscription_data: {
        metadata: { supabaseUserId: user.id },
      },
    })

    return json({ url: session.url })
  } catch (err) {
    return json({ error: (err as Error).message }, 400)
  }
})

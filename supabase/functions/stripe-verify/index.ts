// Supabase Edge Function: stripe-verify
// Verifies a completed Stripe Checkout session
// Deploy: supabase functions deploy stripe-verify --no-verify-jwt
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

function getSupabaseUrl() {
  const value = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('PROJECT_URL')
  if (!value) throw new Error('SUPABASE_URL or PROJECT_URL is not set in Supabase secrets')
  return value
}

function getServiceRoleKey() {
  const value = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY')
  if (!value) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY is not set in Supabase secrets')
  }
  return value
}

async function getAuthenticatedUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (!token) throw new Error('Missing Authorization bearer token')

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
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set in Supabase secrets')

    const supabase = createClient(getSupabaseUrl(), getServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const user = await getAuthenticatedUser(req, supabase)
    const stripe = new Stripe(stripeKey)
    const { sessionId } = await req.json()

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    if (session.mode !== 'subscription') {
      throw new Error('Checkout session is not a subscription')
    }

    if (session.metadata?.supabaseUserId !== user.id) {
      throw new Error('Checkout session does not belong to the signed-in user')
    }

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      throw new Error('Payment not completed')
    }

    const sub = session.subscription as Stripe.Subscription
    if (!sub?.id) throw new Error('Subscription missing from checkout session')

    const currentPeriodEnd = (sub as any).current_period_end
      ? new Date((sub as any).current_period_end * 1000).toISOString()
      : null

    const { error: upsertErr } = await supabase.from('user_subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: sub.id,
      status: sub.status,
      current_period_end: currentPeriodEnd,
    }, { onConflict: 'user_id' })

    if (upsertErr) throw new Error(upsertErr.message)

    return json({
      status: sub.status,
      customerId: session.customer as string,
      subscriptionId: sub.id,
      currentPeriodEnd,
    })
  } catch (err) {
    return json({ error: (err as Error).message }, 400)
  }
})

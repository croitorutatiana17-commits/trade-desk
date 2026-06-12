// Supabase Edge Function: stripe-verify
// Verifies a completed Stripe Checkout session
// Deploy: supabase functions deploy stripe-verify --no-verify-jwt
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId } = await req.json()

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      throw new Error('Payment not completed')
    }

    const sub = session.subscription as Stripe.Subscription
    return new Response(JSON.stringify({
      status: sub.status,
      customerId: session.customer as string,
      subscriptionId: sub.id,
      currentPeriodEnd: (sub as any).current_period_end * 1000,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

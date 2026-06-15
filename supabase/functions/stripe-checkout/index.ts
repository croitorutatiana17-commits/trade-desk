// Supabase Edge Function: stripe-checkout
// Creates a Stripe Checkout session and returns the URL
// Deploy: supabase functions deploy stripe-checkout --no-verify-jwt
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const priceId = Deno.env.get('STRIPE_PRICE_ID')

    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set in Supabase secrets')
    if (!priceId) throw new Error('STRIPE_PRICE_ID is not set in Supabase secrets')

    const stripe = new Stripe(stripeKey)
    const { userEmail, userId, successUrl, cancelUrl } = await req.json()

    const existing = await stripe.customers.list({ email: userEmail, limit: 1 })
    const customer = existing.data.length > 0
      ? existing.data[0]
      : await stripe.customers.create({
          email: userEmail,
          metadata: { supabaseUserId: userId },
        })

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: { supabaseUserId: userId },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

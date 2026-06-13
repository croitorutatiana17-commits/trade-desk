// Billing state: trial + subscription management via Supabase user metadata
// Trial: 14 days from account creation stored in user_metadata.trial_start
// Subscription: active once Stripe checkout completes, stored in user_metadata.subscription

import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

export type BillingStatus =
  | 'loading'          // Determining state
  | 'trialing'         // Within 14-day free trial
  | 'trial_expired'    // Trial over, no subscription
  | 'active'           // Paid and active
  | 'cancelled'        // Subscription cancelled but may still have access

export interface BillingState {
  status: BillingStatus
  trialDaysLeft: number        // 0 if expired or subscribed
  trialEndsAt: Date | null
  isBlocked: boolean           // true when trial_expired with no subscription
  subscriptionId: string | null
}

const TRIAL_DAYS = 14

export function useBilling(): BillingState {
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState<BillingState>({
    status: 'loading',
    trialDaysLeft: TRIAL_DAYS,
    trialEndsAt: null,
    isBlocked: false,
    subscriptionId: null,
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setState(s => ({ ...s, status: 'loading' }))
      return
    }

    const meta = user.user_metadata ?? {}

    // Subscription takes priority
    if (meta.subscription_status === 'active' || meta.subscription_status === 'trialing') {
      setState({
        status: 'active',
        trialDaysLeft: 0,
        trialEndsAt: null,
        isBlocked: false,
        subscriptionId: meta.subscription_id ?? null,
      })
      return
    }

    // Compute trial window from account creation time
    const createdAt = new Date(user.created_at)
    const trialEndsAt = new Date(createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
    const now = new Date()
    const msLeft = trialEndsAt.getTime() - now.getTime()
    const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))

    if (msLeft > 0) {
      setState({
        status: 'trialing',
        trialDaysLeft: daysLeft,
        trialEndsAt,
        isBlocked: false,
        subscriptionId: null,
      })
    } else {
      setState({
        status: 'trial_expired',
        trialDaysLeft: 0,
        trialEndsAt,
        isBlocked: true,
        subscriptionId: null,
      })
    }
  }, [user, authLoading])

  return state
}

// Called after successful Stripe checkout to update user metadata
export async function activateSubscription(subscriptionId: string, customerId: string) {
  const { error } = await supabase.auth.updateUser({
    data: {
      subscription_status: 'active',
      subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      subscribed_at: new Date().toISOString(),
    },
  })
  if (error) throw error
}

// Get the app URL for Stripe redirects — prefers explicit env var, falls back to current origin
export function getAppUrl(): string {
  const explicit =
    (import.meta.env.VITE_APP_URL as string | undefined) ||
    process.env.APP_URL
  return explicit || (typeof window !== 'undefined' ? window.location.origin : '')
}

// Read Supabase creds — support both VITE_ (Vite dev) and unprefixed (Vercel)
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  process.env.SUPABASE_URL || ''
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  process.env.SUPABASE_ANON_KEY || ''

// Call the stripe-checkout Supabase Edge Function
export async function createStripeCheckoutSession(params: {
  userEmail: string
  userId: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error ?? 'Checkout failed')
  return data.url as string
}

// Call the stripe-verify Supabase Edge Function
export async function verifyStripeSession(sessionId: string): Promise<{
  status: string
  customerId: string
  subscriptionId: string
  currentPeriodEnd: number
}> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ sessionId }),
  })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error ?? 'Verification failed')
  return data
}

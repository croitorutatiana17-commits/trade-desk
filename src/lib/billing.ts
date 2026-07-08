// Billing state: trial + subscription management via server-owned records.
// Trial: 14 days from account creation.
// Subscription: active only when Stripe verification/webhooks write user_subscriptions.

import { useEffect, useState } from 'react'
import { supabase, supabaseAnonKey, supabaseProjectUrl } from './supabase'
import { useAuth } from './auth'
import type { UserSubscriptionRow } from './database.types'

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

    const currentUser = user
    let cancelled = false

    async function loadBilling() {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle()

      if (cancelled) return

      if (!error && data && isSubscriptionActive(data as UserSubscriptionRow)) {
        setState({
          status: 'active',
          trialDaysLeft: 0,
          trialEndsAt: null,
          isBlocked: false,
          subscriptionId: (data as UserSubscriptionRow).stripe_subscription_id,
        })
        return
      }

      const createdAt = new Date(currentUser.created_at)
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
    }

    void loadBilling()
    return () => { cancelled = true }
  }, [user, authLoading])

  return state
}

function isSubscriptionActive(subscription: UserSubscriptionRow) {
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return false
  }
  if (!subscription.current_period_end) return true
  return new Date(subscription.current_period_end).getTime() > Date.now()
}

// Get the app URL for Stripe redirects — prefers explicit env var, falls back to current origin
export function getAppUrl(): string {
  const explicit =
    (import.meta.env.VITE_APP_URL as string | undefined) ||
    process.env.APP_URL
  return explicit || (typeof window !== 'undefined' ? window.location.origin : '')
}

async function getAuthenticatedFunctionHeaders() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const accessToken = data.session?.access_token
  if (!accessToken) throw new Error('Please sign in before continuing')
  if (!supabaseProjectUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured for billing requests')
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'apikey': supabaseAnonKey,
  }
}

// Call the stripe-checkout Supabase Edge Function
export async function createStripeCheckoutSession(params: {
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const headers = await getAuthenticatedFunctionHeaders()
  const res = await fetch(`${supabaseProjectUrl}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers,
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
  currentPeriodEnd: string | null
}> {
  const headers = await getAuthenticatedFunctionHeaders()
  const res = await fetch(`${supabaseProjectUrl}/functions/v1/stripe-verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId }),
  })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error ?? 'Verification failed')
  return data
}

import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth, signOut } from '~/lib/auth'
import {
  getAppUrl,
  createStripeCheckoutSession,
  verifyStripeSession,
} from '~/lib/billing'

const NAVY = '#1B2A4A'
const PRICE = '$19'
const PERIOD = 'month'

export default function SubscribePage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const session_id = searchParams.get('session_id') ?? undefined

  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(!!session_id)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!session_id || !user) return

    setVerifying(true)
    verifyStripeSession(session_id)
      .then(async () => {
        await new Promise(r => setTimeout(r, 600))
        navigate('/')
      })
      .catch(err => {
        setError('Payment verification failed: ' + (err as Error).message)
        setVerifying(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session_id, user])

  const handleSubscribe = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const appUrl = getAppUrl()
      const url = await createStripeCheckoutSession({
        successUrl: `${appUrl}/subscribe`,
        cancelUrl: `${appUrl}/subscribe`,
      })
      window.location.href = url
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to start checkout')
      setLoading(false)
    }
  }

  if (authLoading || !user || verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-amber-500 animate-spin mx-auto" />
          <p className="font-semibold text-gray-700">
            {verifying ? 'Activating your subscription...' : 'Checking your session...'}
          </p>
          <p className="text-sm text-gray-400">Just a moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg mb-3" style={{ backgroundColor: NAVY }}>
            T
          </div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>TradeDesk Pro</h1>
          <p className="text-sm text-gray-400 mt-1">Your free trial has ended</p>
        </div>

        {/* Pricing card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 text-center" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #243B5E 100%)` }}>
            <p className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-1">TradeDesk Pro</p>
            <div className="flex items-end justify-center gap-1">
              <span className="text-4xl font-bold text-white">{PRICE}</span>
              <span className="text-white/70 mb-1.5">/{PERIOD}</span>
            </div>
            <p className="text-xs text-white/50 mt-1">Billed monthly · Cancel anytime</p>
          </div>

          <div className="p-5 space-y-3">
            {[
              'Unlimited jobs & customers',
              'Professional invoicing',
              'Customer notes & history',
              'Real-time dashboard',
              'Job photo uploads',
              'Priority support',
            ].map(feature => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#f59e0b20' }}>
                  <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          <div className="px-5 pb-5 space-y-3">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
                {error}
              </div>
            )}
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full rounded-xl py-4 font-bold text-white text-base disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{ backgroundColor: '#f59e0b', boxShadow: '0 8px 24px rgba(245,158,11,0.3)' }}
            >
              {loading ? (
                <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Redirecting to Stripe…</>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                  Subscribe for {PRICE}/{PERIOD}
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-400">
              Secure payment via Stripe. Cancel anytime.
            </p>
            <p className="text-center text-xs text-gray-400 leading-5">
              By subscribing, you agree to the{' '}
              <Link to="/terms" className="font-semibold hover:text-gray-600">
                Terms
              </Link>{' '}
              and acknowledge the{' '}
              <Link to="/privacy" className="font-semibold hover:text-gray-600">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-400">
          <Link to="/privacy" className="font-semibold hover:text-gray-600">
            Privacy
          </Link>
          <Link to="/terms" className="font-semibold hover:text-gray-600">
            Terms
          </Link>
          <Link to="/support" className="font-semibold hover:text-gray-600">
            Support
          </Link>
        </div>

        <button
          onClick={async () => { await signOut(); navigate('/login') }}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

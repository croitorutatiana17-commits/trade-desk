import { Component, type ReactNode, useEffect } from 'react'
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '~/lib/auth'
import { useBilling } from '~/lib/billing'
import { isSupabaseConfigured } from '~/lib/supabase'

import Dashboard from '~/routes/index'
import LoginPage from '~/routes/login'
import ResetPasswordPage from '~/routes/reset-password'
import SubscribePage from '~/routes/subscribe'
import { PrivacyPolicyPage, TermsPage, SupportPage } from '~/routes/legal'
import CustomersPage from '~/routes/customers'
import CustomerProfilePage from '~/routes/customers.$customerId'
import JobsPage from '~/routes/jobs'
import NewJobPage from '~/routes/jobs.new'
import JobDetailPage from '~/routes/jobs.$jobId'
import InvoicesPage from '~/routes/invoices'
import NewInvoicePage from '~/routes/invoices.new'
import InvoiceDetailPage from '~/routes/invoices.$invoiceId'
import PublicInvoicePage from '~/routes/invoices.public'

// ── Error Boundary ──────────────────────────────────────────────────────────
interface EBState { hasError: boolean; message: string }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }
  static getDerivedStateFromError(err: unknown): EBState {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: 480, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
              {this.state.message || 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#1e3a5f', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Misconfiguration banner ─────────────────────────────────────────────────
function MissingEnvBanner() {
  if (isSupabaseConfigured) return null
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#dc2626', color: '#fff', padding: '10px 16px', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
      ⚠️ Missing environment variables: add SUPABASE_URL and SUPABASE_ANON_KEY in Vercel project settings, then redeploy.
    </div>
  )
}

const AUTH_ROUTES = ['/login', '/reset-password', '/subscribe']
const PUBLIC_ROUTES = ['/invoice', '/privacy', '/terms', '/support']

function AppShell() {
  const location = useLocation()
  const path = location.pathname
  const isAuthRoute = AUTH_ROUTES.some(r => path === r || path.startsWith(r))
  const isPublicRoute = PUBLIC_ROUTES.some(r => path === r || path.startsWith(r + '/'))

  const { user, loading: authLoading } = useAuth()
  const billing = useBilling()
  const navigate = useNavigate()

  useEffect(() => {
    if (authLoading) return
    if (!user && !isAuthRoute && !isPublicRoute) navigate('/login')
  }, [user, authLoading, isAuthRoute, isPublicRoute, navigate])

  useEffect(() => {
    if (!user || billing.status === 'loading' || isAuthRoute || isPublicRoute) return
    if (billing.isBlocked) navigate('/subscribe')
  }, [user, billing.status, billing.isBlocked, isAuthRoute, isPublicRoute, navigate])

  if (authLoading || (user && billing.status === 'loading')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      {!isAuthRoute && !isPublicRoute && user && billing.status === 'trialing' && (
        <TrialBanner daysLeft={billing.trialDaysLeft} endsAt={billing.trialEndsAt} />
      )}
      <main className={isAuthRoute || isPublicRoute ? 'flex-1' : 'flex-1 pb-20'}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/invoice/:shareToken" element={<PublicInvoicePage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:customerId" element={<CustomerProfilePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/new" element={<NewJobPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/new" element={<NewInvoicePage />} />
          <Route path="/invoices/:invoiceId" element={<InvoiceDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAuthRoute && !isPublicRoute && user && !billing.isBlocked && <Nav path={path} />}
    </div>
  )
}

function TrialBanner({ daysLeft, endsAt }: { daysLeft: number; endsAt: Date | null }) {
  const navigate = useNavigate()
  const isUrgent = daysLeft <= 3
  const formattedDate = endsAt
    ? endsAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <div
      className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-sm"
      style={{
        backgroundColor: isUrgent ? '#fef2f2' : '#fffbeb',
        borderBottom: `1px solid ${isUrgent ? '#fecaca' : '#fde68a'}`,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base shrink-0">{isUrgent ? '⚠️' : '⏳'}</span>
        <p className={`font-medium truncate ${isUrgent ? 'text-red-700' : 'text-amber-800'}`}>
          {daysLeft === 0
            ? 'Your free trial expires today'
            : daysLeft === 1
            ? '1 day left in your free trial'
            : `${daysLeft} days left in your free trial`}
          {formattedDate && (
            <span className={`text-xs ml-1 ${isUrgent ? 'text-red-500' : 'text-amber-600'}`}>
              (ends {formattedDate})
            </span>
          )}
        </p>
      </div>
      <button
        onClick={() => navigate('/subscribe')}
        className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-colors"
        style={{ backgroundColor: isUrgent ? '#dc2626' : '#f59e0b' }}
      >
        Subscribe
      </button>
    </div>
  )
}

function Nav({ path }: { path: string }) {
  const tabs = [
    { id: '/', label: 'Home', icon: '🏠' },
    { id: '/jobs', label: 'Jobs', icon: '🔧' },
    { id: '/customers', label: 'Customers', icon: '👥' },
    { id: '/invoices', label: 'Invoices', icon: '📄' },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto pb-safe">
        {tabs.map(t => {
          const active = path === t.id || (t.id !== '/' && path.startsWith(t.id))
          return (
            <Link key={t.id} to={t.id}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[48px] min-w-[64px] px-3 transition-colors ${active ? 'text-navy-900' : 'text-gray-400'}`}>
              <span className="text-xl leading-none">{t.icon}</span>
              <span className={`text-[11px] font-semibold leading-none ${active ? 'text-navy-900' : 'text-gray-400'}`}>{t.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MissingEnvBanner />
        <AppShell />
      </AuthProvider>
    </ErrorBoundary>
  )
}

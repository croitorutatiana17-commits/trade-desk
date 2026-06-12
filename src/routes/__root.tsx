import {
  HeadContent, Outlet, Scripts,
  createRootRouteWithContext, Link,
  useMatches, useNavigate,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import appCss from '~/styles/app.css?url'
import { AuthProvider, useAuth } from '~/lib/auth'
import { useBilling } from '~/lib/billing'

export const Route = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
      { title: 'TradeDesk' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootLayout,
})

function RootLayout() {
  return (
    <html>
      <head><HeadContent /></head>
      <body>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  )
}

const AUTH_ROUTES = ['/login', '/subscribe']

function AppShell() {
  const matches = useMatches()
  const last = matches[matches.length - 1]
  const path = last?.id ?? '/'
  const isAuthRoute = AUTH_ROUTES.some(r => path === r || path.startsWith(r))

  const { user, loading: authLoading } = useAuth()
  const billing = useBilling()
  const navigate = useNavigate()

  // Auth guard
  useEffect(() => {
    if (authLoading) return
    if (!user && !isAuthRoute) navigate({ to: '/login' })
  }, [user, authLoading, isAuthRoute, navigate])

  // Billing gate
  useEffect(() => {
    if (billing.status === 'loading' || isAuthRoute) return
    if (billing.isBlocked) navigate({ to: '/subscribe', search: { session_id: undefined } })
  }, [billing.status, billing.isBlocked, isAuthRoute, navigate])

  if (authLoading || billing.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      {!isAuthRoute && user && billing.status === 'trialing' && (
        <TrialBanner daysLeft={billing.trialDaysLeft} endsAt={billing.trialEndsAt} />
      )}
      <main className={isAuthRoute ? 'flex-1' : 'flex-1 pb-20'}>
        <Outlet />
      </main>
      {!isAuthRoute && user && !billing.isBlocked && <Nav path={path} />}
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
        onClick={() => navigate({ to: '/subscribe', search: { session_id: undefined } })}
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

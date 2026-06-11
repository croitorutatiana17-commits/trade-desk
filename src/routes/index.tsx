import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useAuth, signOut } from '~/lib/auth'
import { useDashboardStats } from '~/lib/queries'

export const Route = createFileRoute('/')({ component: Dashboard })

const NAVY = '#1B2A4A'
const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled', in_progress: 'In Progress',
  completed: 'Completed', cancelled: 'Cancelled',
}

function StatCard({ label, value, sub, green }: { label: string; value: string; sub?: string; green?: boolean }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${green ? 'text-green-600' : ''}`} style={!green ? { color: NAVY } : {}}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: stats, loading } = useDashboardStats(user?.id)

  const todayJobs = stats?.todayJobs ?? []
  const recentCustomers = stats?.recentCustomers ?? []
  const outstanding = stats?.outstandingAmt ?? 0
  const jobsThisMonth = stats?.jobsThisMonth ?? 0
  const revenueThisMonth = stats?.revenueThisMonth ?? 0

  const displayName = user?.email?.split('@')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-10 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-xl font-bold" style={{ color: NAVY }}>TradeDesk</h1>
            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={async () => { await signOut(); navigate({ to: '/login' }) }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: NAVY }}
            title="Sign out"
          >
            {displayName[0].toUpperCase()}
          </button>
        </div>

        {/* New Job CTA */}
        <button
          onClick={() => navigate({ to: '/jobs/new' })}
          className="w-full text-white rounded-2xl py-4 font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: '#f59e0b', boxShadow: '0 8px 24px rgba(245,158,11,0.3)' }}
        >
          <span className="text-2xl leading-none">+</span> New Job
        </button>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Today's Jobs" value={String(todayJobs.length)} />
            <StatCard
              label="Outstanding"
              value={outstanding > 0 ? `$${outstanding.toLocaleString()}` : '$0'}
              sub={outstanding > 0 ? 'unpaid invoices' : 'all paid'}
            />
            <StatCard label="Jobs This Month" value={String(jobsThisMonth)} />
            <StatCard
              label="Revenue (Month)"
              value={`$${revenueThisMonth.toLocaleString()}`}
              green
            />
          </div>
        )}

        {/* Today's Jobs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
              {todayJobs.length > 0 ? "Today's Jobs" : 'Recent Jobs'}
            </h2>
            <Link to="/jobs" className="text-xs font-semibold" style={{ color: NAVY }}>See all</Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2].map(i => <div key={i} className="bg-white rounded-2xl p-4 h-16 animate-pulse border border-gray-100" />)}
            </div>
          ) : todayJobs.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">No jobs scheduled today</p>
              <button
                onClick={() => navigate({ to: '/jobs/new' })}
                className="mt-2 text-sm font-semibold"
                style={{ color: NAVY }}
              >
                Create your first job →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayJobs.map(job => (
                <Link
                  key={job.id}
                  to="/jobs/$jobId"
                  params={{ jobId: job.id }}
                  className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.99] transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{job.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{job.customers?.name ?? '—'}</p>
                      {job.scheduled_time && (
                        <p className="text-xs text-gray-400 mt-1">{job.scheduled_time}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[job.status]}`}>
                        {STATUS_LABELS[job.status]}
                      </span>
                      <span className="text-xs font-semibold text-gray-400">${job.price.toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Customers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Recent Customers</h2>
            <Link to="/customers" className="text-xs font-semibold" style={{ color: NAVY }}>See all</Link>
          </div>
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse h-32" />
          ) : recentCustomers.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">No customers yet</p>
              <Link to="/customers" className="mt-2 text-sm font-semibold block" style={{ color: NAVY }}>
                Add a customer →
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
              {recentCustomers.slice(0, 5).map(c => {
                const initials = c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                return (
                  <Link
                    key={c.id}
                    to="/customers/$customerId"
                    params={{ customerId: c.id }}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                      style={{ backgroundColor: NAVY }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{c.name}</p>
                      {c.email && <p className="text-xs text-gray-400 truncate">{c.email}</p>}
                    </div>
                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

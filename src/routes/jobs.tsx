import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '~/lib/auth'
import { useJobs } from '~/lib/queries'
import { STATUS_COLORS, STATUS_LABELS } from '~/data'
import type { JobStatus } from '~/lib/database.types'

export const Route = createFileRoute('/jobs')({
  component: JobsPage,
})

const STATUS_TABS: { value: JobStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

function JobsPage() {
  const { user } = useAuth()
  const { data: jobs, loading, error } = useJobs(user?.id)
  const [filter, setFilter] = useState<JobStatus | ''>('')

  const allJobs = jobs ?? []
  const filtered = filter ? allJobs.filter(j => j.status === filter) : allJobs

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-10 animate-fade-in">

        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1B2A4A' }}>Jobs</h1>
            <p className="text-sm text-gray-400">{allJobs.length} total</p>
          </div>
          <Link to="/jobs/new" className="text-sm font-semibold px-4 py-2 rounded-xl text-white hover:opacity-90 transition-colors" style={{ backgroundColor: '#1B2A4A' }}>
            + New Job
          </Link>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map(tab => (
            <button key={tab.value} onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors shrink-0 ${filter === tab.value ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              style={filter === tab.value ? { backgroundColor: '#1B2A4A' } : {}}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                  <div className="h-5 bg-gray-100 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600">{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700">{filter ? `No ${STATUS_LABELS[filter]} jobs` : 'No jobs yet'}</p>
            <p className="text-sm text-gray-400 mt-1">Create your first job to get started</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map(job => (
              <Link key={job.id} to="/jobs/$jobId" params={{ jobId: job.id }}
                className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.99] transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{job.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{(job as any).customers?.name ?? 'No customer'}</p>
                    {job.scheduled_date && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(job.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {job.scheduled_time ? ' · ' + job.scheduled_time : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[job.status]}`}>
                      {STATUS_LABELS[job.status]}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">${job.price.toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

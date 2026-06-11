import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '~/lib/auth'
import { useJob, updateJobStatus, type JobStatus } from '~/lib/queries'

export const Route = createFileRoute('/jobs/$jobId')({ component: JobDetailPage })

const STATUS_FLOW: JobStatus[] = ['scheduled', 'in_progress', 'completed']
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

function JobDetailPage() {
  const { jobId } = Route.useParams()
  const { user } = useAuth()
  const { data: job, loading, refetch } = useJob(jobId, user?.id)

  const [status, setStatus] = useState<JobStatus | 'cancelled'>('scheduled')
  const [showNotes, setShowNotes] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (job) setStatus(job.status)
  }, [job])

  const currentIdx = STATUS_FLOW.indexOf(status as JobStatus)
  const nextStatus: JobStatus | null = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIdx + 1] : null

  const handleStatusChange = async (newStatus: JobStatus | 'cancelled') => {
    if (!job) return
    setUpdating(true)
    await updateJobStatus(job.id, newStatus as JobStatus)
    setStatus(newStatus)
    setUpdating(false)
    refetch()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto space-y-3 pb-10">
        <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse mt-2" />
        {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse border border-gray-100" />)}
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="font-semibold text-gray-700 mb-2">Job not found</p>
          <Link to="/jobs" className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>Back to jobs</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 max-w-lg mx-auto space-y-3 pb-10">

        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <Link to="/jobs" className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          {status !== 'cancelled' && (
            <button onClick={() => setConfirmCancel(true)} className="text-sm text-red-500 font-semibold px-3 py-2 hover:bg-red-50 rounded-xl transition-colors">
              Cancel Job
            </button>
          )}
        </div>

        {/* Status + Title */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[status]}`}>
                {STATUS_LABELS[status]}
              </span>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{job.title}</h1>
              {job.category && (
                <span className="inline-flex items-center text-sm bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-lg">
                  {job.category}
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>${job.price.toLocaleString()}</p>
            </div>
          </div>

          {/* Progress bar */}
          {status !== 'cancelled' && (
            <div className="space-y-2">
              <div className="flex gap-1.5">
                {STATUS_FLOW.map((s, i) => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= currentIdx ? 'bg-amber-500' : 'bg-gray-200'}`} />
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                <span>Scheduled</span><span>In Progress</span><span>Completed</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            {nextStatus && status !== 'cancelled' && (
              <button
                onClick={() => handleStatusChange(nextStatus)}
                disabled={updating}
                className="flex-1 text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#1B2A4A' }}
              >
                {updating ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
                {nextStatus === 'in_progress' ? 'Mark In Progress' : 'Mark Completed'}
              </button>
            )}
            {status === 'completed' && (
              <div className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-700 rounded-xl py-3 text-sm font-semibold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Job Completed
              </div>
            )}
            {status === 'cancelled' && (
              <div className="flex-1 flex items-center justify-center bg-gray-100 text-gray-500 rounded-xl py-3 text-sm font-semibold">
                Job Cancelled
              </div>
            )}
            {(status === 'completed' || status === 'in_progress') && (
              <Link to="/invoices/new" search={{ jobId }}
                className="flex items-center gap-1.5 text-white rounded-xl px-4 py-3 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ backgroundColor: '#f59e0b' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Invoice
              </Link>
            )}
          </div>
        </div>

        {/* Customer */}
        {job.customers && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</h2>
            <Link to="/customers/$customerId" params={{ customerId: job.customers.id }}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0" style={{ backgroundColor: '#1B2A4A' }}>
                {job.customers.name[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{job.customers.name}</p>
                <p className="text-xs text-gray-400">Tap to view profile</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        )}

        {/* Schedule */}
        {(job.scheduled_date || job.scheduled_time) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Schedule</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div>
                {job.scheduled_date && (
                  <p className="font-semibold text-gray-900">
                    {new Date(job.scheduled_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                {job.scheduled_time && <p className="text-sm text-gray-500">{job.scheduled_time}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {job.description && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{job.description}</p>
          </div>
        )}

        {/* Internal Notes */}
        {job.notes && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button onClick={() => setShowNotes(!showNotes)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Internal Notes</h2>
              </div>
              <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showNotes ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {showNotes && (
              <div className="px-5 pb-4 border-t border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed pt-3">{job.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Create Invoice CTA */}
        {status !== 'cancelled' && (
          <Link to="/invoices/new" search={{ jobId }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-lg active:scale-[0.98] transition-all"
            style={{ backgroundColor: '#f59e0b', color: '#fff', boxShadow: '0 8px 24px rgba(245,158,11,0.3)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Create Invoice — ${job.price.toLocaleString()}
          </Link>
        )}
      </div>

      {/* Cancel modal */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40" onClick={() => setConfirmCancel(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">Cancel this job?</h3>
            <p className="text-sm text-gray-500">This will mark the job as cancelled.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmCancel(false)} className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">Keep Job</button>
              <button
                onClick={async () => { await handleStatusChange('cancelled'); setConfirmCancel(false) }}
                className="flex-1 rounded-xl bg-red-500 text-white py-3 text-sm font-semibold hover:bg-red-600">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

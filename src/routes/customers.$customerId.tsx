import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '~/lib/auth'
import { useCustomer, useCustomerStats, updateCustomerNotes } from '~/lib/queries'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700', in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700', cancelled: 'bg-gray-100 text-gray-500',
  draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700', overdue: 'bg-red-50 text-red-600',
}
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
  draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue',
}

export default function CustomerProfilePage() {
  const { customerId } = useParams<{ customerId: string }>()
  const { user } = useAuth()
  const { data: customer, loading: custLoading } = useCustomer(customerId, user?.id)
  const { loading: statsLoading, jobCount, revenue, outstanding, jobs, invoices } = useCustomerStats(customerId, user?.id)

  const [notesText, setNotesText] = useState('')
  const [notesSaved, setNotesSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'jobs' | 'invoices'>('jobs')

  useEffect(() => {
    if (customer) setNotesText(customer.notes ?? '')
  }, [customer])

  const handleSaveNotes = async () => {
    if (!customer) return
    await updateCustomerNotes(customer.id, notesText)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  if (custLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto space-y-3 pb-10">
        <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse mt-2" />
        {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse border border-gray-100" />)}
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="font-semibold text-gray-700 mb-2">Customer not found</p>
          <Link to="/customers" className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>Back to customers</Link>
        </div>
      </div>
    )
  }

  const initials = customer.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const sortedJobs = [...jobs].sort((a, b) => {
    const o: Record<string, number> = { in_progress: 0, scheduled: 1, completed: 2, cancelled: 3 }
    return (o[a.status] ?? 9) - (o[b.status] ?? 9)
  })
  const sortedInvoices = [...invoices].sort((a, b) => {
    const o: Record<string, number> = { overdue: 0, sent: 1, draft: 2, paid: 3 }
    return (o[a.status] ?? 9) - (o[b.status] ?? 9)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 max-w-lg mx-auto space-y-3 pb-10 animate-fade-in">

        <div className="flex items-center justify-between pt-2">
          <Link to="/customers" className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0" style={{ backgroundColor: '#1B2A4A' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Customer since {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{jobCount}</p>
              <p className="text-xs text-gray-400 font-medium">Jobs</p>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="text-lg font-bold" style={{ color: '#1B2A4A' }}>${revenue.toLocaleString()}</p>
              <p className="text-xs text-gray-400 font-medium">Revenue</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold ${outstanding > 0 ? 'text-amber-600' : 'text-green-600'}`}>${outstanding.toLocaleString()}</p>
              <p className="text-xs text-gray-400 font-medium">Outstanding</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact</h2>
          {customer.phone && (
            <a href={`tel:${customer.phone}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors -mx-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{customer.phone}</p>
                <p className="text-xs text-gray-400">Tap to call</p>
              </div>
            </a>
          )}
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors -mx-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{customer.email}</p>
                <p className="text-xs text-gray-400">Tap to email</p>
              </div>
            </a>
          )}
          {customer.address && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(customer.address)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors -mx-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{customer.address}</p>
                <p className="text-xs text-gray-400">Get directions</p>
              </div>
            </a>
          )}
          {!customer.phone && !customer.email && !customer.address && (
            <p className="text-sm text-gray-400 py-2">No contact info on file</p>
          )}
        </div>

        {/* Jobs / Invoices tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(['jobs', 'invoices'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative ${activeTab === tab ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                {tab === 'jobs' ? `Jobs (${jobCount})` : `Invoices (${invoices.length})`}
                {activeTab === tab && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-amber-500" />}
              </button>
            ))}
          </div>

          {activeTab === 'jobs' && (
            <div className="divide-y divide-gray-50">
              {sortedJobs.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No jobs yet</div>
              ) : sortedJobs.map(job => (
                <Link key={job.id} to={`/jobs/${job.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {job.scheduled_date ? new Date(job.scheduled_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date set'}
                      {job.category ? ' · ' + job.category : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-gray-700">${job.price.toLocaleString()}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status]}`}>{STATUS_LABELS[job.status]}</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="divide-y divide-gray-50">
              {sortedInvoices.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No invoices yet</div>
              ) : sortedInvoices.map(inv => (
                <Link key={inv.id} to={`/invoices/${inv.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{inv.invoice_number}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {inv.status === 'paid' && inv.paid_at
                        ? `Paid ${new Date(inv.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                        : `Due ${new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-gray-700">${inv.total.toLocaleString()}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status]}`}>{STATUS_LABELS[inv.status]}</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Internal Notes</h2>
            {notesSaved && (
              <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Saved
              </span>
            )}
          </div>
          <textarea
            value={notesText}
            onChange={e => setNotesText(e.target.value)}
            onBlur={handleSaveNotes}
            rows={4}
            placeholder="Add notes about this customer…"
            className="w-full text-sm rounded-xl border-2 border-gray-100 px-4 py-3 text-gray-700 placeholder-gray-300 focus:border-amber-400 focus:outline-none transition-colors resize-none bg-gray-50"
          />
          <button onClick={handleSaveNotes}
            className="w-full rounded-xl py-2.5 text-sm font-semibold transition-colors"
            style={{ backgroundColor: notesSaved ? '#f0fdf4' : '#1B2A4A', color: notesSaved ? '#16a34a' : '#fff' }}>
            {notesSaved ? '✓ Notes saved' : 'Save Notes'}
          </button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2">
          <Link to="/jobs/new"
            className="flex flex-col items-center gap-2 bg-white rounded-2xl py-4 shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">New Job</span>
          </Link>
          <Link to="/invoices/new"
            className="flex flex-col items-center gap-2 bg-white rounded-2xl py-4 shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">New Invoice</span>
          </Link>
        </div>

      </div>
    </div>
  )
}

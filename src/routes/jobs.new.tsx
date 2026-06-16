import { Link, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '~/lib/auth'
import { useCustomers, createJob, createCustomer } from '~/lib/queries'

const JOB_TYPES = [
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'Carpentry', label: 'Carpentry' },
  { value: 'Painting', label: 'Painting' },
  { value: 'Landscaping', label: 'Landscaping' },
  { value: 'Cleaning', label: 'Cleaning' },
  { value: 'Other', label: 'Other' },
]

export default function NewJobPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: customers } = useCustomers(user?.id)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [customerQuery, setCustomerQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState('')
  const [jobType, setJobType] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [status, setStatus] = useState('scheduled')
  const [notes, setNotes] = useState('')

  const filteredCustomers = customerQuery.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(customerQuery.toLowerCase()) ||
        (c.email ?? '').toLowerCase().includes(customerQuery.toLowerCase())
      )
    : customers.slice(0, 8)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectCustomer = (c: { id: string; name: string }) => {
    setSelectedCustomer(c)
    setCustomerQuery(c.name)
    setShowDropdown(false)
    setIsNewCustomer(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!title.trim()) { setError('Job title is required'); return }
    if (!price || isNaN(parseFloat(price))) { setError('Valid price is required'); return }

    setSaving(true)
    setError('')

    try {
      let customerId: string | undefined

      if (isNewCustomer && newCustomerName.trim()) {
        const { data: newCust, error: custErr } = await createCustomer({
          user_id: user.id,
          name: newCustomerName.trim(),
          email: newCustomerEmail.trim() || undefined,
          phone: newCustomerPhone.trim() || undefined,
        })
        if (custErr) { setError('Failed to create customer: ' + custErr.message); return }
        customerId = newCust?.id
      } else if (selectedCustomer) {
        customerId = selectedCustomer.id
      }

      const { data: job, error: jobErr } = await createJob({
        user_id: user.id,
        customer_id: customerId,
        title: title.trim(),
        category: jobType || undefined,
        description: description.trim() || undefined,
        status,
        scheduled_date: scheduledDate || undefined,
        scheduled_time: scheduledTime || undefined,
        price: parseFloat(price),
        notes: notes.trim() || undefined,
      })

      if (jobErr) { setError('Failed to save job: ' + (jobErr as any).message); return }
      navigate(`/jobs/${job!.id}`)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:border-amber-400 focus:outline-none transition-colors'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-10 animate-fade-in">

        <div className="flex items-center gap-3 pt-2">
          <Link to="/jobs" className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1B2A4A' }}>New Job</h1>
            <p className="text-sm text-gray-400">Fill in the job details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Customer */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</h2>

            {!isNewCustomer ? (
              <div ref={dropdownRef} className="relative">
                <input
                  type="text"
                  value={customerQuery}
                  onChange={e => { setCustomerQuery(e.target.value); setSelectedCustomer(null); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search existing customers…"
                  className={inputCls}
                />
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 max-h-52 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400">No customers found</div>
                    ) : (
                      filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectCustomer(c)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#1B2A4A' }}>
                            {c.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                            {c.email && <p className="text-xs text-gray-400 truncate">{c.email}</p>}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {selectedCustomer && (
                  <p className="mt-1.5 text-xs text-green-600 font-medium">✓ {selectedCustomer.name} selected</p>
                )}
                <button type="button" onClick={() => { setIsNewCustomer(true); setNewCustomerName(customerQuery.trim()); setCustomerQuery(''); setSelectedCustomer(null) }}
                  className="mt-2 text-sm font-semibold" style={{ color: '#f59e0b' }}>
                  + Add new customer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">New Customer</p>
                  <button type="button" onClick={() => setIsNewCustomer(false)} className="text-xs text-gray-400 hover:text-gray-600">
                    Search existing
                  </button>
                </div>
                <input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Full name *" className={inputCls} required={isNewCustomer} />
                <input value={newCustomerEmail} onChange={e => setNewCustomerEmail(e.target.value)} type="email" placeholder="Email address" className={inputCls} />
                <input value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} placeholder="Phone number" className={inputCls} />
              </div>
            )}
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Job Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Water Heater Replacement" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select value={jobType} onChange={e => setJobType(e.target.value)} className={inputCls + ' bg-white'}>
                  <option value="">Select…</option>
                  {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input value={price} onChange={e => setPrice(e.target.value)} required type="number" min="0" step="0.01" placeholder="0.00" className={inputCls + ' pl-7'} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Job scope and details…" className={inputCls + ' resize-none'} />
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Schedule</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Time</label>
                <input type="text" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} placeholder="e.g. 9:00 AM" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { v: 'scheduled', l: 'Scheduled', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { v: 'in_progress', l: 'In Progress', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { v: 'completed', l: 'Completed', cls: 'bg-green-50 text-green-700 border-green-200' },
                ].map(s => (
                  <button
                    key={s.v} type="button" onClick={() => setStatus(s.v)}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${status === s.v ? s.cls : 'bg-white text-gray-500 border-gray-200'}`}
                  >
                    {s.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Internal Notes <span className="text-gray-300 font-normal normal-case">· optional</span></h2>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notes for your team…" className={inputCls + ' resize-none'} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <Link to="/jobs" className="flex items-center justify-center rounded-xl border-2 border-gray-200 px-5 py-4 text-gray-700 font-semibold hover:bg-gray-50 text-sm transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl py-4 text-white font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{ backgroundColor: '#1B2A4A' }}
            >
              {saving ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving…</>
              ) : 'Save Job'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

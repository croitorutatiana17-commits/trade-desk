import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '~/lib/auth'
import { useCustomers, useJob, createInvoice } from '~/lib/queries'

type LineItem = { id: string; description: string; quantity: number; unitPrice: number }

function makeid() { return Math.random().toString(36).slice(2, 9) }
function genInvNum() {
  return `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
}

export default function NewInvoicePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const jobId = searchParams.get('jobId') ?? undefined

  const { data: jobData } = useJob(jobId, user?.id)
  const { data: customers } = useCustomers(user?.id)

  const today = new Date().toISOString().split('T')[0]
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const [invoiceNumber] = useState(genInvNum)
  const [customerId, setCustomerId] = useState<string>('')
  const [issueDate, setIssueDate] = useState(today)
  const [dueDate, setDueDate] = useState(in30)
  const [taxRate, setTaxRate] = useState('0')
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const jobPreFilled = !!jobData
  const billedCustomerId = jobPreFilled ? (jobData.customer_id ?? '') : customerId

  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (jobData) {
      return [{ id: makeid(), description: jobData.title, quantity: 1, unitPrice: jobData.price }]
    }
    return [{ id: makeid(), description: '', quantity: 1, unitPrice: 0 }]
  })

  const addItem = () => setLineItems(p => [...p, { id: makeid(), description: '', quantity: 1, unitPrice: 0 }])
  const removeItem = (id: string) => setLineItems(p => p.filter(i => i.id !== id))
  const updateItem = (id: string, field: keyof LineItem, val: string | number) =>
    setLineItems(p => p.map(i => i.id === id ? { ...i, [field]: val } : i))

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const taxAmt = subtotal * (parseFloat(taxRate || '0') / 100)
  const total = subtotal + taxAmt

  const effectiveCustomerId = billedCustomerId || customerId
  const canSubmit = (jobPreFilled || effectiveCustomerId) && dueDate && lineItems.every(i => i.description.trim())

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !canSubmit) return
    setSending(true)
    setError('')

    try {
      const { error: err } = await createInvoice(
        {
          user_id: user.id,
          customer_id: effectiveCustomerId || undefined,
          job_id: jobId || undefined,
          invoice_number: invoiceNumber,
          status: 'sent',
          subtotal,
          tax_rate: parseFloat(taxRate || '0'),
          tax_amount: taxAmt,
          total,
          issue_date: issueDate,
          due_date: dueDate,
          notes: notes.trim() || undefined,
        },
        lineItems.map((li, i) => ({
          description: li.description,
          quantity: li.quantity,
          unit_price: li.unitPrice,
          total: li.quantity * li.unitPrice,
          sort_order: i,
        }))
      )

      if (err) { setError('Failed to send: ' + (err as any).message); return }

      setSent(true)
      setTimeout(() => navigate('/invoices'), 800)
    } finally {
      setSending(false)
    }
  }

  const inputCls = 'w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:border-amber-400 focus:outline-none transition-colors'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 max-w-lg mx-auto space-y-3 pb-10 animate-fade-in">

        <div className="flex items-center gap-3 pt-2">
          <Link
            to={jobId ? `/jobs/${jobId}` : '/invoices'}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm transition-all shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1B2A4A' }}>New Invoice</h1>
            <p className="text-sm text-gray-400 font-mono">{invoiceNumber}</p>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-3">

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Details</h2>

            {jobPreFilled && jobData ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bill to</label>
                <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                  <span className="text-sm font-semibold text-gray-800">
                    {jobData.customers?.name ?? 'Customer'}
                  </span>
                  <span className="ml-auto text-xs text-gray-400 truncate">via job: {jobData.title}</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bill to</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)} required className={inputCls + ' bg-white'}>
                  <option value="">Select customer…</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Issue date</label>
                <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Due date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className={inputCls} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Line Items</h2>
              <button type="button" onClick={addItem} className="text-sm font-semibold flex items-center gap-1" style={{ color: '#f59e0b' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add item
              </button>
            </div>

            {lineItems.map((item, idx) => {
              const lineTotal = item.quantity * item.unitPrice
              return (
                <div key={item.id} className="border-2 border-gray-100 rounded-xl p-3 space-y-2 hover:border-gray-200 transition-colors">
                  <div className="flex items-start gap-2">
                    <input
                      value={item.description}
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                      placeholder={`Item ${idx + 1} description`}
                      required
                      className="flex-1 text-sm font-medium text-gray-900 placeholder-gray-300 bg-transparent outline-none"
                    />
                    {lineItems.length > 1 && (
                      <button type="button" onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border-2 border-gray-200 rounded-lg px-2 py-1.5 w-[52px] focus-within:border-amber-400 transition-colors">
                      <input type="number" min="1" value={item.quantity}
                        onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full text-sm text-center text-gray-900 bg-transparent outline-none" />
                    </div>
                    <span className="text-gray-300">×</span>
                    <div className="flex items-center gap-1 border-2 border-gray-200 rounded-lg px-2 py-1.5 flex-1 focus-within:border-amber-400 transition-colors">
                      <span className="text-sm text-gray-400">$</span>
                      <input type="number" min="0" step="0.01" value={item.unitPrice}
                        onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full text-sm text-gray-900 bg-transparent outline-none" />
                    </div>
                    <span className="text-gray-300">=</span>
                    <p className="text-sm font-bold text-gray-900 w-16 text-right">${lineTotal.toFixed(2)}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tax & Totals</h2>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 shrink-0">Tax rate</label>
              <div className="flex items-center gap-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 w-28 focus-within:border-amber-400 transition-colors">
                <input type="number" min="0" max="100" step="0.5" value={taxRate}
                  onChange={e => setTaxRate(e.target.value)}
                  className="w-full text-sm text-gray-900 bg-transparent outline-none" />
                <span className="text-sm text-gray-400 shrink-0">%</span>
              </div>
              <div className="flex gap-1.5 ml-auto">
                {['0','5','10','15'].map(r => (
                  <button key={r} type="button" onClick={() => setTaxRate(r)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${taxRate === r ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    style={taxRate === r ? { backgroundColor: '#f59e0b' } : {}}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-800">${subtotal.toFixed(2)}</span>
              </div>
              {taxAmt > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({parseFloat(taxRate).toFixed(1)}%)</span>
                  <span className="font-semibold text-gray-800">${taxAmt.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline border-t border-gray-200 pt-3">
                <span className="font-bold text-gray-900 text-base">Total due</span>
                <span className="font-bold text-2xl" style={{ color: '#1B2A4A' }}>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Notes <span className="text-gray-300 font-normal normal-case">· optional</span>
            </h2>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Payment terms, bank details, thank you message…"
              className={inputCls + ' resize-none'} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <Link
              to={jobId ? `/jobs/${jobId}` : '/invoices'}
              className="flex items-center justify-center rounded-xl border-2 border-gray-200 px-5 py-4 text-gray-700 font-semibold hover:bg-gray-50 text-sm"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSubmit || sending || sent}
              className="flex-1 rounded-xl py-4 font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              style={{
                backgroundColor: sent ? '#16a34a' : '#f59e0b',
                color: '#fff',
                boxShadow: sent ? '0 8px 24px rgba(22,163,74,0.3)' : '0 8px 24px rgba(245,158,11,0.3)',
              }}
            >
              {sent ? (
                <><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Invoice Sent!</>
              ) : sending ? (
                <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Sending…</>
              ) : (
                <><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" /></svg> Send Invoice — ${total.toFixed(2)}</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '~/lib/auth'
import { useInvoices } from '~/lib/queries'
import { STATUS_COLORS, STATUS_LABELS } from '~/data'
import type { InvoiceStatus } from '~/lib/database.types'
import { formatDateOnly } from '~/lib/format'

const STATUS_TABS: { value: InvoiceStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
]

export default function InvoicesPage() {
  const { user } = useAuth()
  const { data: invoices, loading, error } = useInvoices(user?.id)
  const [filter, setFilter] = useState<InvoiceStatus | ''>('')

  const allInvoices = invoices ?? []
  const filtered = filter ? allInvoices.filter(i => i.status === filter) : allInvoices
  const ORDER: Record<string, number> = { overdue: 0, sent: 1, draft: 2, paid: 3 }
  const sorted = [...filtered].sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9))

  const outstanding = allInvoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.total, 0)
  const overdueAmt = allInvoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0)
  const paidThisMonth = allInvoices.filter(i => i.status === 'paid' && i.paid_at?.slice(0, 7) === new Date().toISOString().slice(0, 7)).reduce((s, i) => s + i.total, 0)

  const tabCounts = STATUS_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.value] = tab.value === '' ? allInvoices.length : allInvoices.filter(i => i.status === tab.value).length
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-10 animate-fade-in">

        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1B2A4A' }}>Invoices</h1>
            <p className="text-sm text-gray-400">{allInvoices.length} total</p>
          </div>
          <Link to="/invoices/new"
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#1B2A4A' }}>
            + New
          </Link>
        </div>

        {!loading && outstanding > 0 && (
          <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #243B5E 100%)' }}>
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-white">${outstanding.toLocaleString()}</p>
              {overdueAmt > 0 && <p className="text-xs font-semibold text-red-300 mt-1">${overdueAmt.toLocaleString()} overdue</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-1">Paid (this month)</p>
              <p className="text-xl font-bold text-green-300">${paidThisMonth.toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUS_TABS.map(tab => {
            const count = tabCounts[tab.value] ?? 0
            const active = filter === tab.value
            return (
              <button key={tab.value} onClick={() => setFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${active ? 'text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
                style={active ? { backgroundColor: '#1B2A4A' } : {}}>
                {tab.label}
                {count > 0 && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                  <div className="h-6 bg-gray-100 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600">{error}</div>}

        {!loading && !error && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700">No {filter || ''} invoices</p>
            <p className="text-sm text-gray-400 mt-1">Create your first invoice to get started</p>
          </div>
        )}

        {!loading && !error && sorted.length > 0 && (
          <div className="space-y-2">
            {sorted.map(inv => {
              const isOverdue = inv.status === 'overdue'
              const isDraft = inv.status === 'draft'
              const lineItems = (inv as any).invoice_line_items as Array<{ description: string }> | undefined
              return (
                <Link key={inv.id} to={`/invoices/${inv.id}`}
                  className="block bg-white rounded-2xl p-4 shadow-sm border hover:shadow-md active:scale-[0.99] transition-all"
                  style={{ borderColor: isOverdue ? '#fecaca' : '#f3f4f6' }}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-900 font-mono">{inv.invoice_number}</p>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status]}`}>
                          {STATUS_LABELS[inv.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 font-medium">{(inv as any).customers?.name ?? 'Unknown customer'}</p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {inv.status === 'paid' && inv.paid_at ? <>Paid <span className="font-medium text-green-600">{formatDateOnly(inv.paid_at)}</span></>
                          : isOverdue ? <>Due <span className="font-medium text-red-500">{formatDateOnly(inv.due_date)}</span></>
                          : isDraft ? <span>Draft · not sent</span>
                          : <>Due <span className="font-medium">{formatDateOnly(inv.due_date)}</span></>
                        }
                      </p>
                      {lineItems && lineItems.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{lineItems.map((l: { description: string }) => l.description).join(' · ')}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <p className={`text-lg font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>${inv.total.toLocaleString()}</p>
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {sorted.length > 1 && !loading && (
          <div className="flex items-center justify-between px-1 pt-1">
            <p className="text-sm text-gray-400 font-medium">{sorted.length} invoices</p>
            <p className="text-sm font-bold text-gray-700">Total: ${sorted.reduce((s, i) => s + i.total, 0).toLocaleString()}</p>
          </div>
        )}

      </div>
    </div>
  )
}

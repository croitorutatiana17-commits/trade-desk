import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '~/lib/auth'
import { useInvoice, useCustomers, updateInvoiceStatus, type InvoiceStatus } from '~/lib/queries'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-600',
}
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue',
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const { user } = useAuth()
  const { data: invoice, loading, refetch } = useInvoice(invoiceId, user?.id)
  const { data: customers } = useCustomers(user?.id)

  const [status, setStatus] = useState<InvoiceStatus>('draft')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (invoice) setStatus(invoice.status)
  }, [invoice])

  const handleStatus = async (newStatus: InvoiceStatus) => {
    if (!invoice) return
    setUpdating(true)
    await updateInvoiceStatus(invoice.id, newStatus)
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

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="font-semibold text-gray-700 mb-2">Invoice not found</p>
          <Link to="/invoices" className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>Back to invoices</Link>
        </div>
      </div>
    )
  }

  const lineItems = invoice.invoice_line_items ?? []
  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0) || invoice.subtotal
  const taxAmt = invoice.tax_amount
  const grandTotal = invoice.total
  const isOverdue = status === 'overdue'
  const publicUrl = `${window.location.origin}/invoice/${invoice.share_token}`

  const copyPublicUrl = async () => {
    await navigator.clipboard.writeText(publicUrl)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 max-w-lg mx-auto space-y-3 pb-10 animate-fade-in">

        <div className="flex items-center justify-between pt-2">
          <Link to="/invoices" className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <span className="text-xs font-mono text-gray-400">{invoice.invoice_number}</span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </span>
            <p className="text-2xl font-bold" style={{ color: isOverdue ? '#dc2626' : '#1B2A4A' }}>
              ${grandTotal.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{invoice.customers?.name ?? customers.find(c => c.id === invoice.customer_id)?.name ?? 'Customer'}</p>
            <p className="text-sm text-gray-500">Issued: {fmt(invoice.issue_date)}</p>
            <p className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
              Due: {fmt(invoice.due_date)}
            </p>
            {invoice.paid_at && (
              <p className="text-sm text-green-600 font-medium">Paid: {fmt(invoice.paid_at)}</p>
            )}
          </div>

          <div className="flex gap-2">
            {status === 'draft' && (
              <button onClick={() => handleStatus('sent')} disabled={updating}
                className="flex-1 text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#1B2A4A' }}>
                Mark Sent
              </button>
            )}
            {(status === 'sent' || status === 'overdue') && (
              <button onClick={() => handleStatus('paid')} disabled={updating}
                className="flex-1 bg-green-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                Mark Paid ✓
              </button>
            )}
            {status === 'paid' && (
              <span className="flex-1 text-center py-3 text-sm font-semibold text-green-700 bg-green-50 rounded-xl">✓ Paid</span>
            )}
          </div>
        </div>

        {lineItems.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Line Items</h2>
            <div className="divide-y divide-gray-100">
              {lineItems
                .slice()
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(item => {
                  const lineTotal = item.quantity * item.unit_price
                  return (
                    <div key={item.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.description}</p>
                        <p className="text-xs text-gray-500">{item.quantity} × ${item.unit_price.toFixed(2)}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">${lineTotal.toFixed(2)}</p>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-semibold text-gray-800">${subtotal.toFixed(2)}</span>
          </div>
          {taxAmt > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax ({invoice.tax_rate}%)</span>
              <span className="font-semibold text-gray-800">${taxAmt.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
            <span>Total</span>
            <span style={{ color: '#1B2A4A' }}>${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Notes</h2>
            <p className="text-sm text-gray-700">{invoice.notes}</p>
          </div>
        )}

        <div className="flex gap-2">
          {invoice.customers && (
            <Link to={`/customers/${invoice.customers.id}`}
              className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 text-center transition-colors">
              View Customer
            </Link>
          )}
          {invoice.job_id && (
            <Link to={`/jobs/${invoice.job_id}`}
              className="flex-1 rounded-xl py-3 text-sm font-semibold text-white text-center transition-colors hover:opacity-90"
              style={{ backgroundColor: '#1B2A4A' }}>
              View Job
            </Link>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Customer invoice link</h2>
            <p className="text-sm text-gray-500">Share this link with your customer so they can view the invoice.</p>
          </div>
          <div className="flex gap-2">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 text-center transition-colors truncate px-3"
            >
              Open customer view
            </a>
            <button
              type="button"
              onClick={copyPublicUrl}
              className="rounded-xl py-3 px-4 text-sm font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#1B2A4A' }}
            >
              Copy
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

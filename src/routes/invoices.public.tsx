import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '~/lib/supabase'

type PublicLineItem = {
  description: string
  quantity: number
  unit_price: number
  total: number
  sort_order: number
}

type PublicInvoice = {
  id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  issue_date: string
  due_date: string
  paid_at: string | null
  notes: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  line_items: PublicLineItem[]
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function money(amount: number) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function usePublicInvoice(shareToken: string | undefined) {
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      if (!shareToken) {
        setLoading(false)
        setError('Invoice link is missing.')
        return
      }

      setLoading(true)
      setError('')

      const { data, error: err } = await supabase
        .rpc('get_public_invoice', { p_share_token: shareToken })
        .single()

      if (!active) return

      if (err) {
        setInvoice(null)
        setError('This invoice link is invalid or no longer available.')
      } else {
        setInvoice(data as PublicInvoice)
      }
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [shareToken])

  return { invoice, loading, error }
}

export default function PublicInvoicePage() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const { invoice, loading, error } = usePublicInvoice(shareToken)

  const sortedItems = useMemo(
    () => [...(invoice?.line_items ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [invoice?.line_items],
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900">Invoice unavailable</h1>
          <p className="text-sm text-gray-500 mt-2">{error || 'This invoice could not be loaded.'}</p>
        </div>
      </div>
    )
  }

  const isPaid = invoice.status === 'paid'
  const isOverdue = invoice.status === 'overdue'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        <header className="flex items-start justify-between gap-4 py-2">
          <div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-sm mb-3" style={{ backgroundColor: '#1B2A4A' }}>
              T
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
            <p className="text-sm text-gray-500 font-mono mt-1">{invoice.invoice_number}</p>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              isPaid ? 'bg-green-50 text-green-700'
                : isOverdue ? 'bg-red-50 text-red-600'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Payment due'}
          </span>
        </header>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Amount due</p>
            <div className="flex items-end justify-between gap-4">
              <p className="text-4xl font-bold" style={{ color: isOverdue ? '#dc2626' : '#1B2A4A' }}>
                {money(invoice.total)}
              </p>
              {isPaid && invoice.paid_at && (
                <p className="text-sm font-semibold text-green-600">Paid {fmt(invoice.paid_at)}</p>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 p-5 sm:p-6 border-b border-gray-100">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bill to</p>
              <p className="font-semibold text-gray-900">{invoice.customer_name ?? 'Customer'}</p>
              {invoice.customer_email && <p className="text-sm text-gray-500 mt-1">{invoice.customer_email}</p>}
              {invoice.customer_phone && <p className="text-sm text-gray-500 mt-1">{invoice.customer_phone}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Dates</p>
              <p className="text-sm text-gray-600">Issued {fmt(invoice.issue_date)}</p>
              <p className={`text-sm mt-1 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                Due {fmt(invoice.due_date)}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Line items</p>
            <div className="divide-y divide-gray-100">
              {sortedItems.map((item, index) => (
                <div key={`${item.description}-${index}`} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{item.description}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.quantity} x {money(item.unit_price)}</p>
                  </div>
                  <p className="font-semibold text-gray-900 shrink-0">{money(item.total)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 mt-5 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-800">{money(invoice.subtotal)}</span>
              </div>
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({invoice.tax_rate}%)</span>
                  <span className="font-semibold text-gray-800">{money(invoice.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline border-t border-gray-200 pt-3">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>{money(invoice.total)}</span>
              </div>
            </div>
          </div>
        </section>

        {invoice.notes && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Notes</p>
            <p className="text-sm text-gray-700 leading-relaxed">{invoice.notes}</p>
          </section>
        )}

        {!isPaid && (
          <button
            type="button"
            disabled
            className="w-full rounded-2xl py-4 text-white font-bold text-base opacity-60 cursor-not-allowed"
            style={{ backgroundColor: '#f59e0b' }}
          >
            Online payment coming next
          </button>
        )}
      </div>
    </div>
  )
}

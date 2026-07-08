import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '~/lib/auth'
import { useInvoice, useCustomers, useInvoiceActivity, updateInvoiceStatus, sendInvoiceEmail, type InvoiceStatus } from '~/lib/queries'

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

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function money(amount: number, currency = 'usd') {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  })
}

async function edgeFunctionErrorMessage(error: unknown) {
  const fallback = error instanceof Error
    ? error.message
    : 'Invoice email could not be sent'

  const context = (error as { context?: Response } | null)?.context
  if (!context) return fallback

  try {
    const body = await context.clone().json()
    if (typeof body?.error === 'string') return body.error
  } catch {
    // Fall back to the Supabase wrapper message.
  }

  return fallback
}

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const { user } = useAuth()
  const { data: invoice, loading, refetch } = useInvoice(invoiceId, user?.id)
  const { data: customers } = useCustomers(user?.id)
  const { data: activity, refetch: refetchActivity } = useInvoiceActivity(invoiceId, user?.id)

  const [status, setStatus] = useState<InvoiceStatus>('draft')
  const [updating, setUpdating] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailMessage, setEmailMessage] = useState('')
  const [emailError, setEmailError] = useState('')

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
  const timeline = (() => {
    const items: {
      id: string
      at: string
      title: string
      detail: string
      tone: 'neutral' | 'success' | 'warning' | 'danger'
    }[] = [
      {
        id: 'created',
        at: invoice.created_at,
        title: 'Invoice created',
        detail: `${invoice.invoice_number} was created as ${STATUS_LABELS[invoice.status].toLowerCase()}.`,
        tone: 'neutral',
      },
    ]

    if (invoice.invoice_sent_at) {
      items.push({
        id: 'first-sent',
        at: invoice.invoice_sent_at,
        title: 'Invoice first sent',
        detail: invoice.customers?.email
          ? `Sent to ${invoice.customers.email}.`
          : 'Invoice delivery was recorded.',
        tone: 'success',
      })
    }

    activity.emailEvents.forEach(event => {
      items.push({
        id: `email-${event.id}`,
        at: event.created_at,
        title: event.email_type === 'receipt' ? 'Receipt email' : 'Invoice email',
        detail: event.status === 'sent'
          ? `Sent to ${event.customer_email}.`
          : `Failed to send to ${event.customer_email}${event.error_message ? `: ${event.error_message}` : '.'}`,
        tone: event.status === 'sent' ? 'success' : 'danger',
      })
    })

    activity.paymentEvents.forEach(event => {
      const labels: Record<string, string> = {
        checkout_created: 'Payment checkout opened',
        processing: 'Payment processing',
        paid: 'Payment confirmed',
        failed: 'Payment failed',
        refunded: 'Payment refunded',
        cancelled: 'Payment cancelled',
      }
      const tone = event.status === 'paid'
        ? 'success'
        : event.status === 'failed' || event.status === 'cancelled'
          ? 'danger'
          : event.status === 'refunded'
            ? 'warning'
            : 'neutral'

      items.push({
        id: `payment-${event.id}`,
        at: event.paid_at ?? event.created_at,
        title: labels[event.status] ?? 'Payment update',
        detail: `${money(Number(event.amount), event.currency)} ${event.currency.toUpperCase()}`,
        tone,
      })
    })

    if (invoice.paid_at) {
      items.push({
        id: 'paid',
        at: invoice.paid_at,
        title: 'Invoice marked paid',
        detail: `${money(grandTotal)} payment recorded.`,
        tone: 'success',
      })
    }

    if (invoice.receipt_sent_at) {
      items.push({
        id: 'receipt-sent',
        at: invoice.receipt_sent_at,
        title: 'Receipt sent',
        detail: invoice.customers?.email
          ? `Receipt sent to ${invoice.customers.email}.`
          : 'Receipt delivery was recorded.',
        tone: 'success',
      })
    }

    return items
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .filter((item, index, all) =>
        all.findIndex(other =>
          other.title === item.title &&
          other.at === item.at &&
          other.detail === item.detail
        ) === index
      )
  })()

  const copyPublicUrl = async () => {
    await navigator.clipboard.writeText(publicUrl)
  }

  const handleSendEmail = async () => {
    if (!invoice) return

    setEmailSending(true)
    setEmailMessage('')
    setEmailError('')

    const { data, error } = await sendInvoiceEmail(invoice.id)

    if (error || !data?.sent) {
      setEmailError(await edgeFunctionErrorMessage(error))
      setEmailSending(false)
      return
    }

    setEmailMessage(`Sent to ${data.customerEmail}`)
    setEmailSending(false)
    refetch()
    refetchActivity()
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

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Invoice activity</h2>
            <p className="text-sm text-gray-500">Email delivery and Stripe payment history for this invoice.</p>
          </div>
          <div className="space-y-4">
            {timeline.map(item => (
              <div key={item.id} className="flex gap-3">
                <div
                  className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    item.tone === 'success' ? 'bg-green-50 text-green-700'
                      : item.tone === 'danger' ? 'bg-red-50 text-red-600'
                      : item.tone === 'warning' ? 'bg-amber-50 text-amber-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={
                      item.tone === 'success'
                        ? 'M4.5 12.75l6 6 9-13.5'
                        : item.tone === 'danger'
                          ? 'M6 18L18 6M6 6l12 12'
                          : 'M12 6v6l4 2'
                    } />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-400 shrink-0">{fmtDateTime(item.at)}</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 break-words">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email delivery</h2>
            <p className="text-sm text-gray-500">
              Send a branded email with the invoice details and secure payment link.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900">
              {invoice.customers?.email ?? 'No customer email on file'}
            </p>
            {invoice.invoice_last_sent_at && (
              <p className="text-xs text-gray-500">
                Last sent {fmt(invoice.invoice_last_sent_at)}
                {invoice.invoice_send_count > 1 ? ` (${invoice.invoice_send_count} sends)` : ''}
              </p>
            )}
            {invoice.receipt_sent_at && (
              <p className="text-xs text-green-600 font-medium">Receipt sent {fmt(invoice.receipt_sent_at)}</p>
            )}
          </div>
          {emailMessage && (
            <p className="rounded-xl bg-green-50 px-3 py-2 text-sm font-medium text-green-700">{emailMessage}</p>
          )}
          {emailError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{emailError}</p>
          )}
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={emailSending || !invoice.customers?.email || status === 'paid'}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#1B2A4A' }}
          >
            {emailSending
              ? 'Sending...'
              : invoice.invoice_last_sent_at
                ? 'Resend invoice email'
                : 'Send invoice email'}
          </button>
          {status === 'paid' && (
            <p className="text-xs text-gray-500">Paid invoices no longer need invoice delivery.</p>
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

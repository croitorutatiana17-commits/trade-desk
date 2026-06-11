import os

d = os.path.join(os.path.dirname(__file__), 'src/routes')
D = chr(36)  # $

# Job detail page
jobs_detail = '''import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/jobs/${D}jobId')({
  component: JobDetailPage,
})

function JobDetailPage() {
  const { jobId } = Route.useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('scheduled')
  const [showNotes, setShowNotes] = useState(false)

  const flow = ['scheduled', 'in_progress', 'completed']
  const idx = flow.indexOf(status)
  const next = idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null
  const labels: Record<string, string> = { scheduled: 'Scheduled', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-8 animate-fade-in">
      <div className="flex items-center justify-between pt-2">
        <Link to="/jobs" className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 text-lg">←</Link>
        <div className="flex gap-2">
          <button className="text-sm text-navy-900 font-semibold px-3 py-2 hover:bg-navy-50 rounded-xl transition-colors">Edit</button>
          <button className="text-sm text-red-600 font-semibold px-3 py-2 hover:bg-red-50 rounded-xl transition-colors">Delete</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className={'badge badge-' + status}>{labels[status] || status}</span>
          {next && (
            <button onClick={() => setStatus(next)}
              className="bg-navy-900 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-navy-800 transition-colors">
              Mark {next === 'in_progress' ? 'In Progress' : 'Completed'}
            </button>
          )}
          {(status === 'completed' || status === 'scheduled') && (
            <Link to="/invoices/new" className="bg-amber-500 text-white rounded-xl px-4 py-2 text-sm font-semibold shadow-sm hover:bg-amber-400 transition-colors">📄 Invoice</Link>
          )}
        </div>
        <h1 className="text-xl font-bold text-gray-900">Water Heater Replacement</h1>
        <span className="inline-flex items-center text-sm bg-navy-50 text-navy-700 font-medium px-3 py-1 rounded-lg">🔧 Plumbing</span>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center text-navy-900 font-bold text-lg">S</div>
          <div>
            <p className="font-semibold text-gray-900">Sarah Johnson</p>
            <p className="text-sm text-gray-500">sarah@email.com</p>
            <p className="text-sm text-gray-500">(555) 123-4567</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">📍 742 Maple Drive, Portland, OR 97201</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-2">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Schedule</h2>
        <p className="text-sm text-gray-600">📅 Today, June 4, 2024</p>
        <p className="text-sm text-gray-600">⏰ 9:00 AM</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-2">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Description</h2>
        <p className="text-sm text-gray-600">Replace existing water heater with new energy-efficient model.</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <button onClick={() => setShowNotes(!showNotes)} className="flex items-center justify-between w-full text-left">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Internal Notes</h2>
          <span className="text-gray-400 text-lg">{showNotes ? '−' : '+'}</span>
        </button>
        {showNotes && <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">Customer mentioned previous issues with pressure.</p>}
      </div>

      <Link to="/invoices/new"
        className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white rounded-2xl py-4 font-bold text-lg shadow-lg shadow-amber-500/25 hover:bg-amber-400 active:scale-[0.98] transition-all">
        📄 Create Invoice
      </Link>
    </div>
  )
}
'''

# Invoice detail page
inv_detail = '''import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/invoices/${D}invoiceId')({
  component: InvoiceDetailPage,
})

function InvoiceDetailPage() {
  const { invoiceId } = Route.useParams()
  const [status, setStatus] = useState('sent')
  const isOverdue = status === 'sent'
  const items = [
    { desc: 'Water Heater - 50 Gal', qty: 1, price: 600, total: 600 },
    { desc: 'Installation Labor', qty: 4, price: 50, total: 200 },
    { desc: 'Disposal Fee', qty: 1, price: 50, total: 50 },
  ]
  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const tax = subtotal * 0.10
  const total = subtotal + tax

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-8 animate-fade-in">
      <div className="flex items-center justify-between pt-2">
        <Link to="/invoices" className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 text-lg">←</Link>
        <button className="text-sm text-red-600 font-semibold px-3 py-2 hover:bg-red-50 rounded-xl transition-colors">Delete</button>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">INV-0001</h1>
          <span className={'badge badge-' + (isOverdue ? 'overdue' : status)}>{isOverdue ? 'Overdue' : status}</span>
        </div>
        <p className="text-sm text-gray-500">Issued: Jun 1, 2024</p>
        <p className="text-sm text-gray-500">Due: Jun 15, 2024</p>
        <p className="text-sm font-medium text-gray-700 mt-1">Sarah Johnson</p>
        <p className="text-sm text-gray-500">742 Maple Drive, Portland, OR 97201</p>
      </div>

      <div className="flex gap-2">
        {status === 'draft' && <button onClick={() => setStatus('sent')} className="flex-1 bg-navy-900 text-white rounded-xl py-3 text-sm font-semibold hover:bg-navy-800">Mark Sent</button>}
        {status === 'sent' && <button onClick={() => setStatus('paid')} className="flex-1 bg-green-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-700">Mark Paid</button>}
        {status === 'paid' && <span className="flex-1 text-center py-3 text-sm font-semibold text-green-700 bg-green-50 rounded-xl">✅ Paid</span>}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Line Items</h2>
        <div className="divide-y divide-gray-100">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.desc}</p>
                <p className="text-xs text-gray-500">{item.qty} × ${item.price.toFixed(2)}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">${item.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="text-gray-900 font-medium">${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-500">Tax (10%)</span><span className="text-gray-900 font-medium">${tax.toFixed(2)}</span></div>
        <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2"><span>Total</span><span className="text-navy-900">${total.toFixed(2)}</span></div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">📄 PDF</button>
        <button className="flex-1 bg-navy-900 text-white rounded-xl py-3 text-sm font-semibold hover:bg-navy-800">✉️ Send</button>
      </div>
    </div>
  )
}
'''

with open(os.path.join(d, 'jobs.' + D + 'jobId.tsx'), 'w') as f:
    f.write(jobs_detail)
print("Created jobs.$jobId.tsx")

with open(os.path.join(d, 'invoices.' + D + 'invoiceId.tsx'), 'w') as f:
    f.write(inv_detail)
print("Created invoices.$invoiceId.tsx")

print("All files:", sorted(os.listdir(d)))
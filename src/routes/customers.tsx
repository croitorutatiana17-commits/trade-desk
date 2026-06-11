import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '~/lib/auth'
import { useCustomers } from '~/lib/queries'
import { useCustomerStats } from '~/lib/queries'
import type { CustomerRow } from '~/lib/database.types'

export const Route = createFileRoute('/customers')({
  component: CustomersPage,
})

function CustomerCard({ customer, userId }: { customer: CustomerRow; userId: string }) {
  const { jobCount, revenue, outstanding, loading } = useCustomerStats(customer.id, userId)
  const initials = customer.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <Link
      to="/customers/$customerId"
      params={{ customerId: customer.id }}
      className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.99] transition-all"
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0" style={{ backgroundColor: '#1B2A4A' }}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
        </div>
        {customer.email && <p className="text-sm text-gray-500 truncate">{customer.email}</p>}
        {customer.phone && <p className="text-xs text-gray-400 mt-0.5">{customer.phone}</p>}
      </div>
      <div className="text-right shrink-0 space-y-1">
        {loading ? (
          <div className="w-12 h-4 bg-gray-100 rounded animate-pulse" />
        ) : (
          <>
            <p className="text-sm font-bold text-gray-900">${revenue.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{jobCount} job{jobCount !== 1 ? 's' : ''}</p>
            {outstanding > 0 && (
              <p className="text-xs font-semibold text-amber-600">${outstanding.toLocaleString()} due</p>
            )}
          </>
        )}
      </div>
      <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  )
}

function CustomersPage() {
  const { user } = useAuth()
  const { data: customers, loading, error } = useCustomers(user?.id)
  const [query, setQuery] = useState('')

  const filtered = (customers ?? []).filter(c => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-10 animate-fade-in">

        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1B2A4A' }}>Customers</h1>
            <p className="text-sm text-gray-400">{(customers ?? []).length} total</p>
          </div>
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm" style={{ backgroundColor: '#1B2A4A' }}>
            +
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="search" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="w-full bg-white rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 border border-gray-200 shadow-sm focus:outline-none focus:border-amber-400 transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {query && <p className="text-xs text-gray-400 font-medium px-1">{filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"</p>}

        {/* Loading */}
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600">{error}</div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700">{query ? 'No customers found' : 'No customers yet'}</p>
            <p className="text-sm text-gray-400 mt-1">{query ? 'Try a different search' : 'Add your first customer to get started'}</p>
          </div>
        )}

        {/* List */}
        {!loading && !error && filtered.length > 0 && user && (
          <div className="space-y-2">
            {filtered.map(customer => (
              <CustomerCard key={customer.id} customer={customer} userId={user.id} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

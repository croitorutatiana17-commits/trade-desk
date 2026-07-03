// All Supabase data access — tables exist in DB, typed via JSDoc comments
import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export interface Customer {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  user_id: string
  customer_id: string | null
  title: string
  category: string | null
  description: string | null
  status: JobStatus
  scheduled_date: string | null
  scheduled_time: string | null
  price: number
  notes: string | null
  created_at: string
  // joined
  customers?: { id: string; name: string } | null
}

export interface LineItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  sort_order: number
}

export interface Invoice {
  id: string
  share_token: string
  user_id: string
  customer_id: string | null
  job_id: string | null
  invoice_number: string
  status: InvoiceStatus
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  issue_date: string
  due_date: string
  paid_at: string | null
  invoice_sent_at: string | null
  invoice_last_sent_at: string | null
  invoice_send_count: number
  receipt_sent_at: string | null
  notes: string | null
  created_at: string
  // joined
  customers?: { id: string; name: string; email?: string | null } | null
  invoice_line_items?: LineItem[]
}

// ─── Generic fetch hook ───────────────────────────────────────────────────────
type State<T> = { data: T; loading: boolean; error: string | null }

function useQuery<T>(initialData: T, fetcher: () => Promise<{ data: unknown; error: unknown }>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ data: initialData, loading: true, error: null })
  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    const { data, error } = await fetcher()
    if (error) {
      setState({ data: initialData, loading: false, error: (error as any).message ?? 'Error' })
    } else {
      setState({ data: (data ?? initialData) as T, loading: false, error: null })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => { load() }, [load])
  return { ...state, refetch: load }
}

// ─── Customers ────────────────────────────────────────────────────────────────
export function useCustomers(userId: string | undefined) {
  return useQuery<Customer[]>(
    [],
    async () => {
      if (!userId) return { data: [], error: null }
      return supabase.from('customers').select('*').eq('user_id', userId).order('name') as any
    },
    [userId]
  )
}

export function useCustomer(id: string | undefined, userId: string | undefined) {
  return useQuery<Customer | null>(
    null,
    async () => {
      if (!id || !userId) return { data: null, error: null }
      return supabase.from('customers').select('*').eq('id', id).eq('user_id', userId).single() as any
    },
    [id, userId]
  )
}

export async function createCustomer(customer: {
  user_id: string; name: string; email?: string; phone?: string; address?: string; notes?: string
}) {
  const { data, error } = await (supabase.from('customers').insert(customer).select().single() as any)
  return { data: data as Customer | null, error }
}

export async function updateCustomerNotes(id: string, notes: string) {
  return supabase.from('customers').update({ notes } as any).eq('id', id) as any
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export function useJobs(userId: string | undefined) {
  return useQuery<Job[]>(
    [],
    async () => {
      if (!userId) return { data: [], error: null }
      return supabase
        .from('jobs')
        .select('*, customers(id, name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) as any
    },
    [userId]
  )
}

export function useJob(id: string | undefined, userId: string | undefined) {
  return useQuery<Job | null>(
    null,
    async () => {
      if (!id || !userId) return { data: null, error: null }
      return supabase
        .from('jobs')
        .select('*, customers(id, name)')
        .eq('id', id)
        .eq('user_id', userId)
        .single() as any
    },
    [id, userId]
  )
}

export function useCustomerJobs(customerId: string | undefined, userId: string | undefined) {
  return useQuery<Job[]>(
    [],
    async () => {
      if (!customerId || !userId) return { data: [], error: null }
      return supabase
        .from('jobs')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) as any
    },
    [customerId, userId]
  )
}

export async function createJob(job: {
  user_id: string; customer_id?: string; title: string; category?: string
  description?: string; status?: string; scheduled_date?: string
  scheduled_time?: string; price: number; notes?: string
}) {
  const { data, error } = await (supabase.from('jobs').insert(job as any).select('*, customers(id, name)').single() as any)
  return { data: data as Job | null, error }
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  return supabase.from('jobs').update({ status } as any).eq('id', jobId) as any
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
export function useInvoices(userId: string | undefined) {
  return useQuery<Invoice[]>(
    [],
    async () => {
      if (!userId) return { data: [], error: null }
      return supabase
        .from('invoices')
        .select('*, customers(id, name, email), invoice_line_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) as any
    },
    [userId]
  )
}

export function useInvoice(id: string | undefined, userId: string | undefined) {
  return useQuery<Invoice | null>(
    null,
    async () => {
      if (!id || !userId) return { data: null, error: null }
      return supabase
        .from('invoices')
        .select('*, customers(id, name, email), invoice_line_items(*)')
        .eq('id', id)
        .eq('user_id', userId)
        .single() as any
    },
    [id, userId]
  )
}

export function useCustomerInvoices(customerId: string | undefined, userId: string | undefined) {
  return useQuery<Invoice[]>(
    [],
    async () => {
      if (!customerId || !userId) return { data: [], error: null }
      return supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) as any
    },
    [customerId, userId]
  )
}

export async function createInvoice(
  invoice: {
    user_id: string; customer_id?: string; job_id?: string
    invoice_number: string; status: string
    subtotal: number; tax_rate: number; tax_amount: number; total: number
    issue_date: string; due_date: string; notes?: string
  },
  lineItems: { description: string; quantity: number; unit_price: number; sort_order: number }[]
) {
  const { data: inv, error } = await (supabase.from('invoices').insert(invoice as any).select().single() as any)
  if (error || !inv) return { data: null, error }

  if (lineItems.length > 0) {
    const items = lineItems.map(li => ({ ...li, invoice_id: (inv as any).id }))
    const { error: liErr } = await (supabase.from('invoice_line_items').insert(items as any) as any)
    if (liErr) return { data: null, error: liErr }
  }
  return { data: inv as Invoice, error: null }
}

export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
  const update: Record<string, string> = { status }
  if (status === 'paid') update.paid_at = new Date().toISOString()
  return supabase.from('invoices').update(update as any).eq('id', invoiceId) as any
}

export async function sendInvoiceEmail(invoiceId: string) {
  return supabase.functions.invoke('send-invoice-email', {
    body: { invoiceId },
  }) as Promise<{
    data: { sent: boolean; emailId: string | null; customerEmail: string; sentAt: string } | null
    error: { message?: string } | null
  }>
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────
export function useDashboardStats(userId: string | undefined) {
  return useQuery(
    { todayJobs: [] as Job[], recentCustomers: [] as Customer[], outstandingAmt: 0, jobsThisMonth: 0, revenueThisMonth: 0 },
    async () => {
      if (!userId) return { data: null, error: null }
      const today = new Date().toISOString().split('T')[0]
      const monthStart = today.slice(0, 7) + '-01'

      const [jobsRes, customersRes, invoicesRes] = await Promise.all([
        supabase.from('jobs').select('*, customers(id, name)').eq('user_id', userId).order('created_at', { ascending: false }).limit(50) as any,
        supabase.from('customers').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5) as any,
        supabase.from('invoices').select('status, total, paid_at').eq('user_id', userId) as any,
      ])

      const jobs: Job[] = jobsRes.data ?? []
      const scheduledToday = jobs.filter((j: Job) => j.scheduled_date === today)
      const todayJobs = scheduledToday.length > 0
        ? scheduledToday.slice(0, 5)
        : jobs.filter((j: Job) => j.status !== 'completed' && j.status !== 'cancelled').slice(0, 5)

      const invoices = invoicesRes.data ?? []
      const outstandingAmt = invoices
        .filter((i: any) => i.status === 'sent' || i.status === 'overdue')
        .reduce((s: number, i: any) => s + i.total, 0)

      const monthJobs = jobs.filter((j: Job) => j.created_at >= monthStart)
      const jobsThisMonth = monthJobs.length

      const revenueThisMonth = invoices
        .filter((i: any) => i.status === 'paid' && i.paid_at && i.paid_at >= monthStart)
        .reduce((s: number, i: any) => s + i.total, 0)

      return {
        data: {
          todayJobs,
          recentCustomers: customersRes.data ?? [],
          outstandingAmt,
          jobsThisMonth,
          revenueThisMonth,
        },
        error: null,
      }
    },
    [userId]
  )
}

// ─── Customer stats (for profile page) ───────────────────────────────────────
export function useCustomerStats(customerId: string | undefined, userId: string | undefined) {
  const jobs = useCustomerJobs(customerId, userId)
  const invoices = useCustomerInvoices(customerId, userId)

  const revenue = invoices.data.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const outstanding = invoices.data.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.total, 0)

  return {
    loading: jobs.loading || invoices.loading,
    jobCount: jobs.data.length,
    revenue,
    outstanding,
    jobs: jobs.data,
    invoices: invoices.data,
  }
}

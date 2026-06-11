// Shared mock data for the TradeDesk app

export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  initials: string
  memberSince: string
  notes: string
}

export type Job = {
  id: string
  customerId: string
  title: string
  category: string
  status: JobStatus
  date: string
  price: number
  invoiceId?: string
}

export type Invoice = {
  id: string
  number: string
  customerId: string
  jobId?: string
  status: InvoiceStatus
  total: number
  issueDate: string
  dueDate: string
  paidAt?: string
  lineItems: { desc: string; qty: number; price: number }[]
  taxRate: number
  notes?: string
}

export const CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    phone: '(555) 123-4567',
    address: '742 Maple Drive, Portland, OR 97201',
    initials: 'SJ',
    memberSince: 'March 2022',
    notes: 'Prefers morning appointments. Has a dog (Biscuit). Gate code: #4821.',
  },
  {
    id: 'c2',
    name: 'Mike Chen',
    email: 'mike@email.com',
    phone: '(555) 987-6543',
    address: '215 Oak Street, Portland, OR 97205',
    initials: 'MC',
    memberSince: 'January 2021',
    notes: 'Tenant unit — contact landlord David Park (555-000-1111) for cost overruns.',
  },
  {
    id: 'c3',
    name: 'Lisa Park',
    email: 'lisa@email.com',
    phone: '(555) 456-7890',
    address: '88 Pine Ave, Lake Oswego, OR 97034',
    initials: 'LP',
    memberSince: 'July 2023',
    notes: 'Prefers text over call. Very prompt payer.',
  },
  {
    id: 'c4',
    name: 'Tom Wilson',
    email: 'tom@email.com',
    phone: '(555) 321-6540',
    address: '1420 Cedar Blvd, Beaverton, OR 97005',
    initials: 'TW',
    memberSince: 'June 2020',
    notes: 'Long-term client. Slow to pay invoices — follow up after 14 days.',
  },
  {
    id: 'c5',
    name: 'Emily Davis',
    email: 'emily@email.com',
    phone: '(555) 654-3210',
    address: '303 Elm Court, Hillsboro, OR 97123',
    initials: 'ED',
    memberSince: 'November 2023',
    notes: 'New client. Referred by Tom Wilson.',
  },
  {
    id: 'c6',
    name: 'James Rodriguez',
    email: 'james@email.com',
    phone: '(555) 789-0123',
    address: '57 Birch Lane, Tigard, OR 97224',
    initials: 'JR',
    memberSince: 'April 2024',
    notes: 'First job cancelled. Rescheduling for late June.',
  },
]

export const JOBS: Job[] = [
  { id: '1', customerId: 'c1', title: 'Water Heater Replacement', category: 'Plumbing', status: 'scheduled', date: 'Jun 4, 2024', price: 850, invoiceId: 'i1' },
  { id: '2', customerId: 'c2', title: 'Kitchen Faucet Repair', category: 'Plumbing', status: 'in_progress', date: 'Jun 4, 2024', price: 195 },
  { id: '3', customerId: 'c3', title: 'Drain Cleaning', category: 'Plumbing', status: 'scheduled', date: 'Jun 4, 2024', price: 175, invoiceId: 'i3' },
  { id: '4', customerId: 'c4', title: 'AC Filter Replacement', category: 'HVAC', status: 'completed', date: 'Jun 3, 2024', price: 120, invoiceId: 'i4' },
  { id: '5', customerId: 'c5', title: 'Electrical Panel Upgrade', category: 'Electrical', status: 'scheduled', date: 'Jun 5, 2024', price: 2200 },
  { id: '6', customerId: 'c6', title: 'Bathroom Fan Installation', category: 'Electrical', status: 'cancelled', date: 'Jun 2, 2024', price: 280 },
  // Historical jobs for richer profiles
  { id: '7', customerId: 'c1', title: 'Toilet Replacement', category: 'Plumbing', status: 'completed', date: 'Mar 12, 2024', price: 420, invoiceId: 'i7' },
  { id: '8', customerId: 'c1', title: 'Kitchen Sink Installation', category: 'Plumbing', status: 'completed', date: 'Nov 8, 2023', price: 580, invoiceId: 'i8' },
  { id: '9', customerId: 'c4', title: 'HVAC Annual Service', category: 'HVAC', status: 'completed', date: 'Feb 20, 2024', price: 250, invoiceId: 'i9' },
  { id: '10', customerId: 'c4', title: 'Thermostat Upgrade', category: 'Electrical', status: 'completed', date: 'Oct 5, 2023', price: 380, invoiceId: 'i10' },
  { id: '11', customerId: 'c4', title: 'Water Softener Install', category: 'Plumbing', status: 'completed', date: 'Aug 14, 2023', price: 1100, invoiceId: 'i11' },
  { id: '12', customerId: 'c2', title: 'Bathroom Faucet Replacement', category: 'Plumbing', status: 'completed', date: 'Jan 15, 2024', price: 210, invoiceId: 'i12' },
  { id: '13', customerId: 'c2', title: 'Water Line Repair', category: 'Plumbing', status: 'completed', date: 'Sep 3, 2023', price: 640, invoiceId: 'i13' },
]

export const INVOICES: Invoice[] = [
  {
    id: 'i1', number: 'INV-2024-001', customerId: 'c1', jobId: '1',
    status: 'sent', total: 935, issueDate: '2024-06-01', dueDate: '2024-06-15',
    lineItems: [{ desc: 'Water Heater - 50 Gal', qty: 1, price: 750 }, { desc: 'Installation Labor (3h)', qty: 3, price: 45 }, { desc: 'Fittings & Materials', qty: 1, price: 50 }],
    taxRate: 0, notes: 'Thank you for your business!',
  },
  {
    id: 'i2', number: 'INV-2024-002', customerId: 'c2', jobId: '2',
    status: 'draft', total: 195, issueDate: '2024-06-04', dueDate: '2024-06-18',
    lineItems: [{ desc: 'Faucet Repair Labor (1.5h)', qty: 1, price: 145 }, { desc: 'Replacement Parts', qty: 1, price: 50 }],
    taxRate: 0,
  },
  {
    id: 'i3', number: 'INV-2024-003', customerId: 'c3', jobId: '3',
    status: 'paid', total: 175, issueDate: '2024-05-28', dueDate: '2024-06-11', paidAt: '2024-06-05',
    lineItems: [{ desc: 'Drain Cleaning - Hydro-Jet', qty: 1, price: 175 }],
    taxRate: 0,
  },
  {
    id: 'i4', number: 'INV-2024-004', customerId: 'c4', jobId: '4',
    status: 'overdue', total: 132, issueDate: '2024-05-15', dueDate: '2024-05-29',
    lineItems: [{ desc: 'AC Filter Replacement (4 units)', qty: 4, price: 28 }, { desc: 'Service Call', qty: 1, price: 20 }],
    taxRate: 0,
  },
  {
    id: 'i7', number: 'INV-2024-005', customerId: 'c1', jobId: '7',
    status: 'paid', total: 462, issueDate: '2024-03-12', dueDate: '2024-03-26', paidAt: '2024-03-20',
    lineItems: [{ desc: 'Toilet Replacement', qty: 1, price: 380 }, { desc: 'Labor (1h)', qty: 1, price: 75 }, { desc: 'Materials', qty: 1, price: 7 }],
    taxRate: 0,
  },
  {
    id: 'i8', number: 'INV-2023-089', customerId: 'c1', jobId: '8',
    status: 'paid', total: 638, issueDate: '2023-11-08', dueDate: '2023-11-22', paidAt: '2023-11-15',
    lineItems: [{ desc: 'Kitchen Sink Installation', qty: 1, price: 500 }, { desc: 'Labor (2h)', qty: 2, price: 65 }, { desc: 'Sealant & Parts', qty: 1, price: 8 }],
    taxRate: 0,
  },
  {
    id: 'i9', number: 'INV-2024-006', customerId: 'c4', jobId: '9',
    status: 'paid', total: 275, issueDate: '2024-02-20', dueDate: '2024-03-05', paidAt: '2024-03-18',
    lineItems: [{ desc: 'HVAC Annual Service', qty: 1, price: 200 }, { desc: 'Filter Replacement', qty: 1, price: 55 }, { desc: 'Refrigerant Top-Off', qty: 1, price: 20 }],
    taxRate: 0,
  },
  {
    id: 'i10', number: 'INV-2023-071', customerId: 'c4', jobId: '10',
    status: 'paid', total: 418, issueDate: '2023-10-05', dueDate: '2023-10-19', paidAt: '2023-11-02',
    lineItems: [{ desc: 'Smart Thermostat - Nest', qty: 1, price: 320 }, { desc: 'Installation Labor', qty: 1, price: 98 }],
    taxRate: 0,
  },
  {
    id: 'i11', number: 'INV-2023-052', customerId: 'c4', jobId: '11',
    status: 'paid', total: 1210, issueDate: '2023-08-14', dueDate: '2023-08-28', paidAt: '2023-09-10',
    lineItems: [{ desc: 'Water Softener Unit', qty: 1, price: 900 }, { desc: 'Installation (3h)', qty: 3, price: 90 }, { desc: 'Salt & Materials', qty: 1, price: 40 }],
    taxRate: 0,
  },
  {
    id: 'i12', number: 'INV-2024-007', customerId: 'c2', jobId: '12',
    status: 'paid', total: 231, issueDate: '2024-01-15', dueDate: '2024-01-29', paidAt: '2024-01-25',
    lineItems: [{ desc: 'Bathroom Faucet + Install', qty: 1, price: 180 }, { desc: 'Supply Line Replacement', qty: 1, price: 51 }],
    taxRate: 0,
  },
  {
    id: 'i13', number: 'INV-2023-066', customerId: 'c2', jobId: '13',
    status: 'paid', total: 704, issueDate: '2023-09-03', dueDate: '2023-09-17', paidAt: '2023-09-20',
    lineItems: [{ desc: 'Water Line Repair', qty: 1, price: 550 }, { desc: 'Emergency Call-Out Fee', qty: 1, price: 100 }, { desc: 'Materials', qty: 1, price: 54 }],
    taxRate: 0,
  },
]

// Derived helpers
export function getCustomerJobs(customerId: string) {
  return JOBS.filter(j => j.customerId === customerId)
}

export function getCustomerInvoices(customerId: string) {
  return INVOICES.filter(i => i.customerId === customerId)
}

export function getCustomerRevenue(customerId: string) {
  return getCustomerInvoices(customerId)
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + i.total, 0)
}

export function getCustomerOutstanding(customerId: string) {
  return getCustomerInvoices(customerId)
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + i.total, 0)
}

export const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-600',
}

export const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
}

import { Link } from 'react-router-dom'

const benefits = [
  {
    title: 'Keep customer details organized',
    body: 'Save homeowner contact information and service history so every job and invoice starts with the right details.',
  },
  {
    title: 'Track jobs from request to payment',
    body: 'Create service jobs, schedule work, record prices, and keep today\'s priorities close at hand.',
  },
  {
    title: 'Send professional invoices',
    body: 'Create clean invoices with line items, due dates, and a secure customer-facing invoice link.',
  },
  {
    title: 'Accept cards and see payment status',
    body: 'Customers can pay online by card, and invoices update after Stripe confirms the payment.',
  },
]

const steps = [
  'Add the customer and job details.',
  'Create an invoice with the amount due and due date.',
  'Email the invoice link to your customer.',
  'Get paid by card and track the invoice status.',
]

const faqs = [
  {
    q: 'Who is TradeDesk built for?',
    a: 'TradeDesk is built for solo and small home-service contractors, including electricians, plumbers, HVAC technicians, handymen, and similar field-service professionals.',
  },
  {
    q: 'Can customers pay invoices online?',
    a: 'Yes. Public invoice pages include Stripe card payment when an invoice is unpaid and payment collection is configured.',
  },
  {
    q: 'Does TradeDesk send invoice and receipt emails?',
    a: 'Yes. Contractors can send invoice emails, and customers receive a receipt email after Stripe confirms payment.',
  },
  {
    q: 'What happens after the free trial?',
    a: 'TradeDesk includes a 14-day free trial. After that, continued access is $19 per month.',
  },
]

function BrandMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-base font-black text-white shadow-sm">
      T
    </div>
  )
}

function ProductPreview() {
  return (
    <div className="landing-preview mx-auto w-full max-w-5xl overflow-hidden rounded-none border-y border-white/20 bg-white/95 shadow-2xl md:rounded-lg md:border">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
        <span className="text-xs font-semibold text-gray-500">Invoice INV-2026-2042</span>
      </div>
      <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b border-gray-200 p-5 md:border-b-0 md:border-r md:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase text-gray-400">Customer</p>
              <h3 className="mt-1 text-lg font-bold text-gray-950">Northside Service Call</h3>
              <p className="mt-1 text-sm text-gray-500">Home-service labor and materials</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Due soon</span>
          </div>
          <div className="space-y-3">
            {[
              ['Service labor', '$850.00'],
              ['Parts and materials', '$245.00'],
              ['Permit handling', '$75.00'],
            ].map(([label, amount]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
                <span className="min-w-0 text-sm font-medium text-gray-700">{label}</span>
                <span className="shrink-0 text-sm font-bold text-gray-950">{amount}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 md:p-6">
          <p className="text-xs font-bold uppercase text-gray-400">Amount due</p>
          <p className="mt-1 text-4xl font-black text-navy-900">$1,170.00</p>
          <p className="mt-2 text-sm text-gray-500">Due July 31</p>
          <div className="mt-6 space-y-3">
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm font-bold text-green-800">Card payments ready</p>
              <p className="text-xs text-green-700">Stripe confirms payment before the invoice is marked paid.</p>
            </div>
            <div className="rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-sm font-bold text-gray-800">Customer link</p>
              <p className="truncate text-xs text-gray-500">tradedeshq.com/invoice/secure-link</p>
            </div>
          </div>
          <div className="mt-6 h-12 rounded-lg bg-navy-900 text-center text-sm font-black leading-[3rem] text-white">
            Pay Invoice
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-950">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <BrandMark />
            <span className="text-lg font-black text-navy-900">TradeDesk</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-bold text-gray-600 md:flex">
            <a href="#benefits" className="hover:text-navy-900">Benefits</a>
            <a href="#how-it-works" className="hover:text-navy-900">How it works</a>
            <a href="#pricing" className="hover:text-navy-900">Pricing</a>
            <a href="#faq" className="hover:text-navy-900">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-bold text-navy-900 hover:bg-gray-100">
              Log In
            </Link>
            <Link to="/login?mode=signup" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-amber-400">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#17253d] text-white">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(23,37,61,0.98),rgba(31,50,76,0.92),rgba(55,78,99,0.8))]" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase text-amber-300">Built for home-service contractors</p>
              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Run your service business without complicated software.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50">
                Manage customers and jobs, send professional invoices, accept card payments, and track what has been paid. Built for independent electricians, plumbers, HVAC technicians, handymen, and similar field-service pros.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/login?mode=signup" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-amber-500 px-6 text-base font-black text-white shadow-lg hover:bg-amber-400">
                  Start Free Trial
                </Link>
                <Link to="/login" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/40 px-6 text-base font-black text-white hover:bg-white/10">
                  Log In
                </Link>
              </div>
            </div>
          </div>
          <div className="relative -mb-12 px-0 pb-12 md:px-6">
            <ProductPreview />
          </div>
        </section>

        <section id="benefits" className="bg-gray-50 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-black uppercase text-amber-600">Everything needed after the service call</p>
              <h2 className="mt-3 text-3xl font-black text-navy-900 sm:text-4xl">Keep jobs, customers, invoices, and payments in one place.</h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {benefits.map((benefit, index) => (
                <article key={benefit.title} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-sm font-black text-navy-900">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-xl font-black text-gray-950">{benefit.title}</h3>
                  <p className="mt-3 text-base leading-7 text-gray-600">{benefit.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <p className="text-sm font-black uppercase text-amber-600">How it works</p>
                <h2 className="mt-3 text-3xl font-black text-navy-900 sm:text-4xl">From service call to paid invoice.</h2>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  TradeDesk keeps the flow simple, so independent trade contractors can send professional invoices without turning admin work into another job.
                </p>
              </div>
              <ol className="grid gap-4 sm:grid-cols-2">
                {steps.map((step, index) => (
                  <li key={step} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                    <span className="text-sm font-black text-amber-600">Step {index + 1}</span>
                    <p className="mt-2 text-lg font-bold leading-7 text-gray-950">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="border-y border-gray-200 bg-white px-4 py-16 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase text-amber-600">Built for people who do the work</p>
              <h2 className="mt-3 text-3xl font-black text-navy-900 sm:text-4xl">
                Simple tools for service businesses that need to get paid.
              </h2>
            </div>
            <p className="text-base leading-8 text-gray-600">
              TradeDesk is a simple job management, invoicing, and payment platform for independent home-service
              contractors and small service businesses. It is built for the everyday flow of keeping customer details
              organized, tracking service work, sending professional invoices, accepting card payments, and seeing what
              has been paid.
            </p>
          </div>
        </section>

        <section id="pricing" className="bg-navy-900 px-4 py-20 text-white sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase text-amber-300">Simple pricing</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Start free. Keep it when it saves you time.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50">
                Try TradeDesk for 14 days. After your trial, the subscription is $19 per month for continued access.
              </p>
            </div>
            <div className="rounded-lg border border-white/20 bg-white p-6 text-gray-950 shadow-2xl">
              <p className="text-sm font-black uppercase text-gray-500">TradeDesk</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-black text-navy-900">$19</span>
                <span className="pb-2 text-base font-bold text-gray-500">/ month</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-green-700">14-day free trial included</p>
              <ul className="mt-6 space-y-3 text-sm font-medium text-gray-700">
                <li>Customer and job management</li>
                <li>Professional invoice creation</li>
                <li>Email invoice delivery</li>
                <li>Stripe card payment collection</li>
                <li>Payment status and receipt emails</li>
              </ul>
              <Link to="/login?mode=signup" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-amber-500 px-6 text-base font-black text-white hover:bg-amber-400">
                Start Free Trial
              </Link>
            </div>
          </div>
        </section>

        <section id="faq" className="bg-gray-50 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-sm font-black uppercase text-amber-600">FAQ</p>
              <h2 className="mt-3 text-3xl font-black text-navy-900 sm:text-4xl">Questions before you start</h2>
            </div>
            <div className="mt-10 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-sm">
              {faqs.map(faq => (
                <details key={faq.q} className="group p-5">
                  <summary className="cursor-pointer list-none text-base font-black text-gray-950">
                    <span className="flex items-center justify-between gap-4">
                      {faq.q}
                      <span className="text-xl text-amber-600 group-open:hidden">+</span>
                      <span className="hidden text-xl text-amber-600 group-open:inline">-</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-gray-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-black text-navy-900">Ready to run service work with less admin?</h2>
            <p className="mt-4 text-base leading-7 text-gray-600">
              Start your free trial and set up your first customer, job, and invoice today.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/login?mode=signup" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-amber-500 px-6 text-base font-black text-white hover:bg-amber-400">
                Start Free Trial
              </Link>
              <Link to="/login" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gray-300 px-6 text-base font-black text-navy-900 hover:bg-gray-50">
                Log In
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-sm font-black text-navy-900">TradeDesk</p>
              <a href="mailto:support@tradedeshq.com" className="text-xs font-bold text-gray-500 hover:text-navy-900">
                support@tradedeshq.com
              </a>
              <p className="mt-1 text-xs text-gray-500">© 2026 TradeDesk</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-gray-500">
            <Link to="/privacy" className="hover:text-navy-900">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-navy-900">
              Terms
            </Link>
            <Link to="/support" className="hover:text-navy-900">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

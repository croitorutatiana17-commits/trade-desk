import { Link } from 'react-router-dom'

const NAVY = '#1B2A4A'
const EFFECTIVE_DATE = 'July 20, 2026'

type Section = {
  title: string
  body: string[]
}

function LegalLayout({
  title,
  intro,
  sections,
}: {
  title: string
  intro?: string
  sections: Section[]
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          to="/login"
          className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-700"
        >
          Back to TradeDesk
        </Link>

        <header className="mt-6 mb-8">
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm"
            style={{ backgroundColor: NAVY }}
          >
            T
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
            TradeDesk
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm font-medium text-gray-500">
            Effective Date: {EFFECTIVE_DATE}
          </p>
          {intro && (
            <p className="mt-5 text-base leading-7 text-gray-600">
              {intro}
            </p>
          )}
        </header>

        <article className="space-y-7 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
          {sections.map(section => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-lg font-bold text-gray-950">{section.title}</h2>
              <div className="space-y-3 text-sm leading-6 text-gray-600">
                {section.body.map(paragraph => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </article>

        <footer className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
          <Link to="/privacy" className="font-semibold hover:text-gray-700">
            Privacy
          </Link>
          <Link to="/terms" className="font-semibold hover:text-gray-700">
            Terms
          </Link>
          <Link to="/support" className="font-semibold hover:text-gray-700">
            Support
          </Link>
        </footer>
      </div>
    </div>
  )
}

export function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro="TradeDesk provides invoicing, customer management, job tracking, payment collection, and related business tools for independent contractors and small service businesses. This Privacy Policy explains how we collect, use, store, and share information when you use TradeDesk."
      sections={[
        {
          title: 'Information We Collect',
          body: [
            'We may collect account information, such as your name, email address, login details, account settings, and subscription status.',
            'We may collect business information, such as your company name, logo, customer records, job details, invoices, invoice line items, notes, payment status, and related business records you enter into TradeDesk.',
            'We may collect customer information, such as customer names, email addresses, phone numbers, billing details, job information, invoice amounts, and payment-related status information.',
            'We may collect payment and subscription information, such as Stripe customer IDs, checkout session IDs, payment status, paid dates, subscription status, and related transaction metadata. TradeDesk does not store full credit card numbers.',
            'We may collect technical and usage information, such as browser type, device information, IP address, pages visited, error logs, and general activity needed to operate, secure, and improve TradeDesk.',
          ],
        },
        {
          title: 'How We Use Information',
          body: [
            'We use information to provide and maintain TradeDesk, manage accounts, support invoices and payment links, send transactional emails, process subscriptions, track payment status, improve product reliability, respond to support requests, prevent abuse, and comply with legal or operational obligations.',
          ],
        },
        {
          title: 'Service Providers',
          body: [
            'TradeDesk uses third-party service providers, including Supabase for authentication, database, storage, and backend services; Stripe for payment processing and subscriptions; Resend for transactional email delivery; and Vercel for hosting and deployment.',
            'These providers may process information only as needed to provide their services to TradeDesk.',
          ],
        },
        {
          title: 'Payments',
          body: [
            'Payments are processed by Stripe. TradeDesk does not collect or store full card numbers. Stripe may collect payment information directly under Stripe\'s own terms and privacy policy.',
            'Users are responsible for the accuracy of invoice amounts, taxes, customer information, and business records entered into TradeDesk.',
          ],
        },
        {
          title: 'Data Sharing',
          body: [
            'We do not sell personal information.',
            'We may share information with service providers, when required by law, to protect TradeDesk and its users, or in connection with a business transfer such as a merger, acquisition, financing, or sale of assets.',
          ],
        },
        {
          title: 'Data Retention',
          body: [
            'We keep information for as long as needed to provide TradeDesk, comply with legal obligations, resolve disputes, enforce agreements, maintain records, and support security or backup requirements.',
          ],
        },
        {
          title: 'Security',
          body: [
            'We use reasonable safeguards to protect information. No online service can guarantee complete security. You are responsible for keeping your login credentials secure.',
          ],
        },
        {
          title: 'Your Choices',
          body: [
            'You may update account information, request support, request account deletion, unsubscribe from non-essential communications where available, and request password resets through the login page.',
          ],
        },
        {
          title: 'Children\'s Privacy',
          body: [
            'TradeDesk is intended for business users and is not directed to children under 13. We do not knowingly collect information from children under 13.',
          ],
        },
        {
          title: 'Changes',
          body: [
            'We may update this Privacy Policy from time to time. The updated version will be posted with a new effective date.',
          ],
        },
        {
          title: 'Contact',
          body: [
            'For privacy questions, contact support@tradedeshq.com.',
          ],
        },
      ]}
    />
  )
}

export function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      intro="These Terms of Service govern your use of TradeDesk. By creating an account or using TradeDesk, you agree to these Terms."
      sections={[
        {
          title: 'Use of TradeDesk',
          body: [
            'TradeDesk provides software tools for independent contractors and small service businesses to manage customers, jobs, invoices, payment links, payment status, and related records.',
            'You may use TradeDesk only for lawful business purposes.',
          ],
        },
        {
          title: 'Account Responsibility',
          body: [
            'You are responsible for your login credentials, all activity under your account, keeping your account information accurate, and making sure your use of TradeDesk complies with applicable laws.',
          ],
        },
        {
          title: 'Invoices, Taxes, and Records',
          body: [
            'You are solely responsible for the accuracy of your invoices, line items, amounts, due dates, tax rates, customer information, business records, and communications sent through TradeDesk.',
            'TradeDesk does not provide legal, tax, accounting, or financial advice. You are responsible for determining, collecting, reporting, and paying any applicable taxes.',
          ],
        },
        {
          title: 'Payments',
          body: [
            'TradeDesk uses Stripe to support payment collection. Stripe provides payment processing and may have its own terms, fees, restrictions, and availability.',
            'An invoice should only be treated as paid when payment confirmation is received from Stripe and reflected in TradeDesk. You are responsible for reviewing and reconciling your payment records.',
          ],
        },
        {
          title: 'Subscriptions and Billing',
          body: [
            'TradeDesk may offer a free trial followed by a paid subscription. Launch pricing is a 14-day free trial, then $19 per month, unless otherwise stated at checkout.',
            'By subscribing, you authorize recurring charges through Stripe until canceled.',
          ],
        },
        {
          title: 'Cancellations',
          body: [
            'You may cancel your subscription through the available account or support process. Cancellation stops future billing but does not automatically refund previous charges unless required by law or specifically stated otherwise.',
          ],
        },
        {
          title: 'Acceptable Use',
          body: [
            'You agree not to use TradeDesk for unlawful, fraudulent, deceptive, abusive, or spam-related activity; send misleading invoices; interfere with the service; access systems without authorization; misrepresent your business; or violate customer privacy, payment rules, or applicable law.',
            'We may suspend or terminate accounts that violate these Terms or create legal, security, operational, or payment-processing risk.',
          ],
        },
        {
          title: 'Service Availability',
          body: [
            'We work to keep TradeDesk reliable, but we do not guarantee uninterrupted or error-free service. TradeDesk may be unavailable due to maintenance, updates, outages, third-party issues, or events outside our control.',
          ],
        },
        {
          title: 'Third-Party Services',
          body: [
            'TradeDesk relies on providers including Supabase, Stripe, Resend, and Vercel. We are not responsible for third-party outages, service changes, processing delays, or payment decisions.',
          ],
        },
        {
          title: 'Intellectual Property',
          body: [
            'TradeDesk\'s software, design, branding, and related materials are owned by TradeDesk or its licensors. You may not copy, resell, reverse engineer, or misuse TradeDesk except as allowed by law or written permission.',
          ],
        },
        {
          title: 'User Content',
          body: [
            'You retain ownership of the business information you enter into TradeDesk. You grant TradeDesk permission to use that information as needed to operate, secure, support, and improve the service.',
          ],
        },
        {
          title: 'Disclaimer',
          body: [
            'TradeDesk is provided "as is" and "as available." To the fullest extent permitted by law, we disclaim warranties of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted operation.',
          ],
        },
        {
          title: 'Limitation of Liability',
          body: [
            'To the fullest extent permitted by law, TradeDesk will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, including lost profits, lost revenue, lost data, payment disputes, or business interruption.',
            'To the fullest extent permitted by law, TradeDesk\'s total liability for any claim will not exceed the amount you paid to TradeDesk in the three months before the claim arose.',
          ],
        },
        {
          title: 'Changes',
          body: [
            'We may update these Terms from time to time. Continued use of TradeDesk after changes become effective means you accept the updated Terms.',
          ],
        },
        {
          title: 'Contact',
          body: [
            'For questions, contact support@tradedeshq.com.',
          ],
        },
      ]}
    />
  )
}

export function SupportPage() {
  return (
    <LegalLayout
      title="Support"
      intro="Need help with TradeDesk? Contact us at support@tradedeshq.com."
      sections={[
        {
          title: 'How We Can Help',
          body: [
            'We can help with account access, password resets, subscriptions, invoice email delivery, payment status questions, bug reports, and questions about customers, jobs, invoices, and payment links.',
            'Please do not send full credit card numbers or sensitive payment details by email.',
          ],
        },
        {
          title: 'Business Records and Tax Questions',
          body: [
            'TradeDesk helps you create invoices and track payment status, but you are responsible for your invoice accuracy, tax settings, customer information, and business records.',
            'TradeDesk does not provide legal, tax, accounting, or financial advice.',
          ],
        },
        {
          title: 'Response Times',
          body: [
            'During beta, support response times may vary. We will prioritize account access, invoice delivery, and payment-related issues.',
          ],
        },
        {
          title: 'Service Status',
          body: [
            'TradeDesk relies on providers including Supabase, Stripe, Resend, and Vercel. If one of those providers has an outage, parts of TradeDesk may be temporarily unavailable.',
          ],
        },
      ]}
    />
  )
}

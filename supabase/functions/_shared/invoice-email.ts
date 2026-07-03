type Customer = {
  name: string | null
  email: string | null
}

type InvoiceEmailInput = {
  invoiceNumber: string
  amount: number
  dueDate: string
  paidAt?: string | null
  customer: Customer
  invoiceUrl: string
}

type SendEmailInput = {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}

const BRAND_NAVY = '#1B2A4A'
const BRAND_GOLD = '#F59E0B'
const BRAND_GREEN = '#15803D'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function money(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function layout({
  preheader,
  heading,
  intro,
  badge,
  amountLabel,
  amount,
  invoiceNumber,
  dateLabel,
  dateValue,
  buttonLabel,
  buttonUrl,
  footer,
  accent = BRAND_GOLD,
}: {
  preheader: string
  heading: string
  intro: string
  badge: string
  amountLabel: string
  amount: string
  invoiceNumber: string
  dateLabel: string
  dateValue: string
  buttonLabel: string
  buttonUrl: string
  footer: string
  accent?: string
}) {
  const safeButtonUrl = escapeHtml(buttonUrl)

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 20px;background:${BRAND_NAVY};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <div style="display:inline-block;width:40px;height:40px;border-radius:8px;background:${BRAND_GOLD};color:${BRAND_NAVY};font-size:22px;font-weight:800;line-height:40px;text-align:center;">T</div>
                      <span style="display:inline-block;margin-left:12px;color:#FFFFFF;font-size:22px;font-weight:800;vertical-align:middle;letter-spacing:0;">TradeDesk</span>
                    </td>
                    <td align="right" style="color:#CBD5E1;font-size:13px;">${escapeHtml(badge)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;color:${BRAND_NAVY};font-size:26px;line-height:1.25;">${escapeHtml(heading)}</h1>
                <p style="margin:0 0 28px;color:#4B5563;font-size:16px;line-height:1.55;">${escapeHtml(intro)}</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;margin-bottom:28px;">
                  <tr>
                    <td style="padding:18px;border-bottom:1px solid #E5E7EB;">
                      <div style="color:#6B7280;font-size:12px;font-weight:700;text-transform:uppercase;">Invoice</div>
                      <div style="color:#111827;font-size:18px;font-weight:700;margin-top:4px;">${escapeHtml(invoiceNumber)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px;border-bottom:1px solid #E5E7EB;">
                      <div style="color:#6B7280;font-size:12px;font-weight:700;text-transform:uppercase;">${escapeHtml(amountLabel)}</div>
                      <div style="color:${BRAND_NAVY};font-size:32px;font-weight:800;margin-top:4px;">${escapeHtml(amount)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px;">
                      <div style="color:#6B7280;font-size:12px;font-weight:700;text-transform:uppercase;">${escapeHtml(dateLabel)}</div>
                      <div style="color:#111827;font-size:17px;font-weight:700;margin-top:4px;">${escapeHtml(dateValue)}</div>
                    </td>
                  </tr>
                </table>

                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                  <tr>
                    <td style="background:${accent};border-radius:8px;">
                      <a href="${safeButtonUrl}" style="display:inline-block;padding:15px 24px;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:800;">${escapeHtml(buttonLabel)}</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 10px;color:#6B7280;font-size:14px;line-height:1.5;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:0;word-break:break-all;color:#374151;font-size:14px;line-height:1.5;"><a href="${safeButtonUrl}" style="color:${BRAND_NAVY};">${safeButtonUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;">
                <p style="margin:0;color:#6B7280;font-size:13px;line-height:1.5;">${escapeHtml(footer)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function invoiceEmail(input: InvoiceEmailInput) {
  const customerName = input.customer.name || 'there'
  const amount = money(input.amount)
  const dueDate = formatDate(input.dueDate)

  return {
    subject: `Invoice ${input.invoiceNumber} for ${amount}`,
    html: layout({
      preheader: `Invoice ${input.invoiceNumber} is ready for payment.`,
      heading: `Invoice ${input.invoiceNumber} is ready`,
      intro: `Hi ${customerName}, your invoice from TradeDesk is ready. You can review it and pay securely online.`,
      badge: 'Invoice',
      amountLabel: 'Amount due',
      amount,
      invoiceNumber: input.invoiceNumber,
      dateLabel: 'Due date',
      dateValue: dueDate,
      buttonLabel: 'Pay Invoice',
      buttonUrl: input.invoiceUrl,
      footer: 'TradeDesk helps contractors send professional invoices and collect online payments.',
    }),
    text: `Invoice ${input.invoiceNumber}\nAmount due: ${amount}\nDue date: ${dueDate}\nPay online: ${input.invoiceUrl}`,
  }
}

export function receiptEmail(input: InvoiceEmailInput) {
  const customerName = input.customer.name || 'there'
  const amount = money(input.amount)
  const paidAt = formatDate(input.paidAt || new Date().toISOString())

  return {
    subject: `Receipt for invoice ${input.invoiceNumber}`,
    html: layout({
      preheader: `Payment received for invoice ${input.invoiceNumber}.`,
      heading: 'Payment received',
      intro: `Hi ${customerName}, thank you. Your payment has been received and invoice ${input.invoiceNumber} is now marked paid.`,
      badge: 'Receipt',
      amountLabel: 'Amount paid',
      amount,
      invoiceNumber: input.invoiceNumber,
      dateLabel: 'Paid date',
      dateValue: paidAt,
      buttonLabel: 'View Receipt',
      buttonUrl: input.invoiceUrl,
      footer: 'This receipt was generated by TradeDesk after Stripe confirmed your payment.',
      accent: BRAND_GREEN,
    }),
    text: `Receipt for invoice ${input.invoiceNumber}\nAmount paid: ${amount}\nPaid date: ${paidAt}\nView receipt: ${input.invoiceUrl}`,
  }
}

export async function sendEmail(input: SendEmailInput) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('EMAIL_FROM')

  if (!apiKey) throw new Error('RESEND_API_KEY is not set in Supabase secrets')
  if (!from) throw new Error('EMAIL_FROM is not set in Supabase secrets')

  const body: Record<string, unknown> = {
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  }

  const replyTo = input.replyTo ?? Deno.env.get('EMAIL_REPLY_TO')
  if (replyTo) body.reply_to = replyTo

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof result?.message === 'string'
      ? result.message
      : `Resend request failed with status ${response.status}`
    throw new Error(message)
  }

  return result as { id?: string }
}

// Supabase Edge Function: send-invoice-email
// Sends a branded invoice email with the public invoice payment link.
// Deploy: supabase functions deploy send-invoice-email --no-verify-jwt
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { invoiceEmail, sendEmail } from '../_shared/invoice-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function getSupabaseUrl() {
  return Deno.env.get('SUPABASE_URL') ?? Deno.env.get('PROJECT_URL')
}

function getServiceRoleKey() {
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY')
}

function getAppUrl(req: Request) {
  const configured = Deno.env.get('APP_URL')
  if (configured) return configured.replace(/\/$/, '')

  const origin = req.headers.get('origin')
  if (origin) return origin.replace(/\/$/, '')

  throw new Error('APP_URL is not set and request origin is missing')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const supabaseUrl = getSupabaseUrl()
    const serviceRoleKey = getServiceRoleKey()
    const authHeader = req.headers.get('authorization')

    if (!supabaseUrl) throw new Error('SUPABASE_URL or PROJECT_URL is not set in Supabase secrets')
    if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY is not set in Supabase secrets')
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401)

    const userClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: authData, error: authErr } = await userClient.auth.getUser()
    if (authErr || !authData.user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const { invoiceId } = await req.json()
    if (!invoiceId || typeof invoiceId !== 'string') {
      return json({ error: 'invoiceId is required' }, 400)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: invoice, error: invoiceErr } = await supabase
      .from('invoices')
      .select('id, user_id, invoice_number, share_token, total, due_date, status, invoice_send_count, customers(name, email)')
      .eq('id', invoiceId)
      .eq('user_id', authData.user.id)
      .single()

    if (invoiceErr || !invoice) {
      return json({ error: 'Invoice not found' }, 404)
    }

    const customer = Array.isArray(invoice.customers)
      ? invoice.customers[0]
      : invoice.customers

    if (!customer?.email) {
      return json({ error: 'Customer email is required before sending this invoice' }, 400)
    }

    const invoiceUrl = `${getAppUrl(req)}/invoice/${invoice.share_token}`
    const email = invoiceEmail({
      invoiceNumber: invoice.invoice_number,
      amount: Number(invoice.total),
      dueDate: invoice.due_date,
      customer,
      invoiceUrl,
    })

    try {
      const result = await sendEmail({
        to: customer.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      })

      const sentAt = new Date().toISOString()

      await supabase.from('invoice_email_events').insert({
        invoice_id: invoice.id,
        user_id: invoice.user_id,
        customer_email: customer.email,
        email_type: 'invoice',
        status: 'sent',
        resend_email_id: result.id ?? null,
      })

      const { error: updateErr } = await supabase
        .from('invoices')
        .update({
          status: invoice.status === 'draft' ? 'sent' : invoice.status,
          invoice_sent_at: sentAt,
          invoice_last_sent_at: sentAt,
          invoice_send_count: Number(invoice.invoice_send_count ?? 0) + 1,
        })
        .eq('id', invoice.id)

      if (updateErr) {
        return json({ error: updateErr.message }, 500)
      }

      return json({
        sent: true,
        emailId: result.id ?? null,
        customerEmail: customer.email,
        sentAt,
      })
    } catch (err) {
      await supabase.from('invoice_email_events').insert({
        invoice_id: invoice.id,
        user_id: invoice.user_id,
        customer_email: customer.email,
        email_type: 'invoice',
        status: 'failed',
        error_message: (err as Error).message,
      })

      return json({ error: (err as Error).message }, 502)
    }
  } catch (err) {
    return json({ error: (err as Error).message }, 400)
  }
})

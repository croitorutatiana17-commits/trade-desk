# TradeDesk

TradeDesk helps contractors manage customers, jobs, invoices, email delivery, and Stripe card payments.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the Vite/Supabase values:

   ```bash
   cp .env.example .env.local
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Check TypeScript before shipping:

   ```bash
   npm run lint
   npm run build
   ```

## Required Vercel Environment Variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `APP_URL`

`APP_URL` should be the deployed app URL, for example `https://trade-desk-seven.vercel.app`.
For production, use:

```text
https://tradedeshq.com
```

## Required Supabase Edge Function Secrets

- `SUPABASE_URL` or `PROJECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SERVICE_ROLE_KEY`
- `APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`

`EMAIL_FROM` must use a verified Resend domain, for example `TradeDesk <invoices@tradedeshq.com>`.
`EMAIL_REPLY_TO` should point to the support mailbox, for example `support@tradedeshq.com`.

## Professional Email Setup

TradeDesk uses two domain email addresses:

- `support@tradedeshq.com` for customer support, replies, billing questions, and app help.
- `invoices@tradedeshq.com` for invoice and receipt delivery through Resend.

Adding these addresses to app copy or Supabase secrets does not create actual mailboxes. Configure them with one of these options:

- Google Workspace: create `support@tradedeshq.com` as a user, group, alias, or routing address. Use Google Workspace MX records in DNS if Google handles inbound mail.
- Namecheap Private Email: create `support@tradedeshq.com` in Namecheap Private Email. Use Namecheap Private Email MX records in DNS if Namecheap handles inbound mail.
- Email forwarding: create a forwarder from `support@tradedeshq.com` to the mailbox you monitor. Confirm replies can be sent from the support address before inviting beta users.

For Resend invoice delivery:

1. Keep the `tradedeshq.com` domain verified in Resend.
2. Set Supabase Edge Function secret `EMAIL_FROM` to:

   ```text
   TradeDesk <invoices@tradedeshq.com>
   ```

3. Set Supabase Edge Function secret `EMAIL_REPLY_TO` to:

   ```text
   support@tradedeshq.com
   ```

4. Keep the existing `RESEND_API_KEY` secret active.

Do not change `EMAIL_FROM` to `support@tradedeshq.com` unless that address is also verified and intended for transactional invoice delivery.

## Deploy Supabase Changes

Run the SQL migrations in Supabase SQL Editor or with the Supabase CLI:

```bash
supabase db push
```

Deploy all Edge Functions after changing function code or secrets:

```bash
supabase functions deploy stripe-checkout --no-verify-jwt
supabase functions deploy stripe-verify --no-verify-jwt
supabase functions deploy stripe-invoice-checkout --no-verify-jwt
supabase functions deploy stripe-invoice-webhook --no-verify-jwt
supabase functions deploy send-invoice-email --no-verify-jwt
```

## Stripe Webhooks

Create a Stripe webhook endpoint pointing to:

```text
https://<project-ref>.supabase.co/functions/v1/stripe-invoice-webhook
```

Required events:

- `checkout.session.completed`
- `checkout.session.expired`

Save the signing secret as `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets.

## Closed Beta Smoke Test

1. Sign up or sign in as a beta contractor.
2. Confirm trial/subscription gating still allows access during trial.
3. Create a customer with a real email address.
4. Create an unpaid draft invoice with at least one positive-dollar line item.
5. Open the invoice detail page and confirm the activity timeline shows invoice creation.
6. Click `Send invoice email` and confirm the customer receives the branded invoice email.
7. Open the public invoice link from the email.
8. Pay with a Stripe test card.
9. Confirm the public invoice page updates to paid after Stripe confirms through the webhook.
10. Confirm the authenticated invoice page shows payment and receipt events in the activity timeline.
11. Confirm the customer receives the payment receipt email.

## Launch Safety Notes

- Invoice status should only become paid after Stripe webhook confirmation.
- Subscription access should come from `user_subscriptions`, not browser-editable auth metadata.
- `invoice_payments` and `invoice_email_events` must have RLS enabled before beta users are invited.

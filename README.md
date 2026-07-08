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

## Required Supabase Edge Function Secrets

- `SUPABASE_URL` or `PROJECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SERVICE_ROLE_KEY`
- `APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`

`EMAIL_FROM` must use a verified Resend domain, for example `TradeDesk <invoices@tradedeshq.com>`.

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

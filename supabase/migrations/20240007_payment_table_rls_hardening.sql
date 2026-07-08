-- Make payment-related table access explicit for launch.
-- Clients may read only their own payment/subscription/email event records.
-- Writes are reserved for service-role Edge Functions and Stripe webhooks.

alter table public.invoice_payments enable row level security;
alter table public.invoice_email_events enable row level security;
alter table public.user_subscriptions enable row level security;

drop policy if exists "Users can view their invoice payments" on public.invoice_payments;
drop policy if exists "Users can view their invoice email events" on public.invoice_email_events;
drop policy if exists "Users can view their own subscription" on public.user_subscriptions;

create policy "Users can view their invoice payments"
on public.invoice_payments
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can view their invoice email events"
on public.invoice_email_events
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can view their own subscription"
on public.user_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

revoke all on table public.invoice_payments from anon, authenticated;
revoke all on table public.invoice_email_events from anon, authenticated;
revoke all on table public.user_subscriptions from anon, authenticated;

grant select on table public.invoice_payments to authenticated;
grant select on table public.invoice_email_events to authenticated;
grant select on table public.user_subscriptions to authenticated;

grant all on table public.invoice_payments to service_role;
grant all on table public.invoice_email_events to service_role;
grant all on table public.user_subscriptions to service_role;

-- Track Stripe invoice payments separately from invoices so invoice status can
-- be changed only by webhook-confirmed payment events.

create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_event_id text unique,
  amount numeric not null check (amount >= 0),
  currency text not null default 'usd',
  status text not null check (
    status in (
      'checkout_created',
      'processing',
      'paid',
      'failed',
      'refunded',
      'cancelled'
    )
  ),
  paid_at timestamptz,
  raw_event jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoice_payments_invoice_id_idx
  on public.invoice_payments (invoice_id);

create index if not exists invoice_payments_user_id_idx
  on public.invoice_payments (user_id);

create index if not exists invoice_payments_status_idx
  on public.invoice_payments (status);

alter table public.invoice_payments enable row level security;

drop policy if exists "Users can view their invoice payments" on public.invoice_payments;

create policy "Users can view their invoice payments"
on public.invoice_payments
for select
using (auth.uid() = user_id);

create or replace function public.set_invoice_payments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists invoice_payments_set_updated_at on public.invoice_payments;

create trigger invoice_payments_set_updated_at
before update on public.invoice_payments
for each row
execute function public.set_invoice_payments_updated_at();

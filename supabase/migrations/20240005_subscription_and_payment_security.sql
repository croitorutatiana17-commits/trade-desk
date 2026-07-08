-- Lock down launch-critical payment records and move subscription state out of
-- browser-editable auth metadata.

alter table public.invoice_payments enable row level security;

drop policy if exists "Users can view their invoice payments" on public.invoice_payments;

create policy "Users can view their invoice payments"
on public.invoice_payments
for select
using (auth.uid() = user_id);

create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null check (
    status in (
      'incomplete',
      'incomplete_expired',
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
      'paused'
    )
  ),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_subscriptions_stripe_customer_id_idx
  on public.user_subscriptions (stripe_customer_id);

create index if not exists user_subscriptions_status_idx
  on public.user_subscriptions (status);

alter table public.user_subscriptions enable row level security;

drop policy if exists "Users can view their own subscription" on public.user_subscriptions;

create policy "Users can view their own subscription"
on public.user_subscriptions
for select
using (auth.uid() = user_id);

create or replace function public.set_user_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_subscriptions_set_updated_at on public.user_subscriptions;

create trigger user_subscriptions_set_updated_at
before update on public.user_subscriptions
for each row
execute function public.set_user_subscriptions_updated_at();

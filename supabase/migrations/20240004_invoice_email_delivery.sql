-- Track invoice and receipt email delivery for launch-critical billing flows.

alter table public.invoices
  add column if not exists invoice_sent_at timestamptz,
  add column if not exists invoice_last_sent_at timestamptz,
  add column if not exists invoice_send_count integer not null default 0,
  add column if not exists receipt_sent_at timestamptz;

create table if not exists public.invoice_email_events (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid not null,
  customer_email text not null,
  email_type text not null check (email_type in ('invoice', 'receipt')),
  status text not null check (status in ('sent', 'failed')),
  resend_email_id text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists invoice_email_events_invoice_id_idx
  on public.invoice_email_events (invoice_id);

create index if not exists invoice_email_events_user_id_idx
  on public.invoice_email_events (user_id);

create index if not exists invoice_email_events_created_at_idx
  on public.invoice_email_events (created_at desc);

alter table public.invoice_email_events enable row level security;

drop policy if exists "Users can view their invoice email events" on public.invoice_email_events;

create policy "Users can view their invoice email events"
on public.invoice_email_events
for select
using (auth.uid() = user_id);

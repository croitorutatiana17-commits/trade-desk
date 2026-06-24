-- Public invoice links are resolved through a security-definer RPC, not direct
-- anonymous table reads. Customers only need the unguessable share token.

alter table public.invoices
  add column if not exists share_token uuid not null default gen_random_uuid();

create unique index if not exists invoices_share_token_key
  on public.invoices (share_token);

create or replace function public.get_public_invoice(p_share_token uuid)
returns table (
  id uuid,
  invoice_number text,
  status text,
  subtotal numeric,
  tax_rate numeric,
  tax_amount numeric,
  total numeric,
  issue_date date,
  due_date date,
  paid_at timestamptz,
  notes text,
  customer_name text,
  customer_email text,
  customer_phone text,
  line_items jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    i.id,
    i.invoice_number,
    i.status::text,
    i.subtotal,
    i.tax_rate,
    i.tax_amount,
    i.total,
    i.issue_date,
    i.due_date,
    i.paid_at,
    i.notes,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'description', li.description,
          'quantity', li.quantity,
          'unit_price', li.unit_price,
          'total', li.quantity * li.unit_price,
          'sort_order', li.sort_order
        )
        order by li.sort_order
      ) filter (where li.id is not null),
      '[]'::jsonb
    ) as line_items
  from public.invoices i
  left join public.customers c on c.id = i.customer_id
  left join public.invoice_line_items li on li.invoice_id = i.id
  where i.share_token = p_share_token
  group by i.id, c.id;
$$;

revoke all on function public.get_public_invoice(uuid) from public;
grant execute on function public.get_public_invoice(uuid) to anon, authenticated;

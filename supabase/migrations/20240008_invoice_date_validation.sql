-- Keep invoice date validation on the server so bad invoices cannot be
-- created through direct RPC calls or future clients.

create or replace function public.create_invoice_with_line_items(
  p_customer_id uuid,
  p_job_id uuid,
  p_invoice_number text,
  p_status text,
  p_tax_rate numeric,
  p_issue_date date,
  p_due_date date,
  p_notes text,
  p_line_items jsonb
)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_invoice public.invoices;
  v_item jsonb;
  v_subtotal numeric := 0;
  v_tax_rate numeric := coalesce(p_tax_rate, 0);
  v_tax_amount numeric := 0;
  v_total numeric := 0;
  v_issue_date date := coalesce(p_issue_date, current_date);
  v_description text;
  v_quantity numeric;
  v_unit_price numeric;
  v_sort_order integer;
  v_job_customer_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_status not in ('draft', 'sent', 'paid', 'overdue') then
    raise exception 'Invalid invoice status';
  end if;

  if nullif(trim(p_invoice_number), '') is null then
    raise exception 'Invoice number is required';
  end if;

  if p_due_date is null then
    raise exception 'Due date is required';
  end if;

  if p_due_date < v_issue_date then
    raise exception 'Due date cannot be before issue date';
  end if;

  if v_tax_rate < 0 or v_tax_rate > 100 then
    raise exception 'Tax rate must be between 0 and 100';
  end if;

  if jsonb_typeof(coalesce(p_line_items, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_line_items, '[]'::jsonb)) = 0 then
    raise exception 'At least one line item is required';
  end if;

  if p_customer_id is not null and not exists (
    select 1 from public.customers
    where id = p_customer_id and user_id = v_user_id
  ) then
    raise exception 'Customer not found';
  end if;

  if p_job_id is not null then
    select customer_id into v_job_customer_id
    from public.jobs
    where id = p_job_id and user_id = v_user_id;

    if not found then
      raise exception 'Job not found';
    end if;

    if p_customer_id is not null
      and v_job_customer_id is not null
      and v_job_customer_id <> p_customer_id then
      raise exception 'Job does not belong to this customer';
    end if;
  end if;

  for v_item in select * from jsonb_array_elements(p_line_items)
  loop
    v_description := nullif(trim(v_item->>'description'), '');
    v_quantity := coalesce((v_item->>'quantity')::numeric, 0);
    v_unit_price := coalesce((v_item->>'unit_price')::numeric, -1);

    if v_description is null then
      raise exception 'Line item description is required';
    end if;

    if v_quantity <= 0 then
      raise exception 'Line item quantity must be greater than zero';
    end if;

    if v_unit_price < 0 then
      raise exception 'Line item unit price cannot be negative';
    end if;

    v_subtotal := v_subtotal + (v_quantity * v_unit_price);
  end loop;

  v_tax_amount := round(v_subtotal * (v_tax_rate / 100), 2);
  v_total := round(v_subtotal + v_tax_amount, 2);

  if v_total <= 0 then
    raise exception 'Invoice total must be greater than zero';
  end if;

  insert into public.invoices (
    user_id,
    customer_id,
    job_id,
    invoice_number,
    status,
    subtotal,
    tax_rate,
    tax_amount,
    total,
    issue_date,
    due_date,
    notes
  )
  values (
    v_user_id,
    p_customer_id,
    p_job_id,
    trim(p_invoice_number),
    p_status,
    v_subtotal,
    v_tax_rate,
    v_tax_amount,
    v_total,
    v_issue_date,
    p_due_date,
    nullif(trim(p_notes), '')
  )
  returning * into v_invoice;

  for v_item in select * from jsonb_array_elements(p_line_items)
  loop
    v_description := nullif(trim(v_item->>'description'), '');
    v_quantity := (v_item->>'quantity')::numeric;
    v_unit_price := (v_item->>'unit_price')::numeric;
    v_sort_order := coalesce((v_item->>'sort_order')::integer, 0);

    insert into public.invoice_line_items (
      invoice_id,
      description,
      quantity,
      unit_price,
      sort_order
    )
    values (
      v_invoice.id,
      v_description,
      v_quantity,
      v_unit_price,
      v_sort_order
    );
  end loop;

  return v_invoice;
end;
$$;

revoke all on function public.create_invoice_with_line_items(
  uuid,
  uuid,
  text,
  text,
  numeric,
  date,
  date,
  text,
  jsonb
) from public;

grant execute on function public.create_invoice_with_line_items(
  uuid,
  uuid,
  text,
  text,
  numeric,
  date,
  date,
  text,
  jsonb
) to authenticated;

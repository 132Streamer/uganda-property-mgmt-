-- ============================================================
-- PropertyHub: Payments table
-- Run AFTER 002_tenants.sql
-- ============================================================

create type payment_method_enum as enum (
  'mtn_mobile_money',
  'airtel_money',
  'cash',
  'bank_transfer'
);

create type payment_status_enum as enum (
  'pending',
  'paid',
  'overdue',
  'partial'
);

create table if not exists payments (
  id               uuid primary key default gen_random_uuid(),
  landlord_id      uuid not null references auth.users(id) on delete cascade,
  tenant_id        uuid not null references tenants(id) on delete cascade,
  property_id      uuid not null references properties(id) on delete cascade,

  -- Amounts in UGX
  amount_due       numeric(12, 0) not null check (amount_due > 0),
  amount_paid      numeric(12, 0) not null default 0 check (amount_paid >= 0),

  -- Dates
  due_date         date not null,
  paid_at          timestamptz,          -- null until marked paid

  -- Payment details (null until paid)
  payment_method   payment_method_enum,
  reference_number text,                 -- MTN/Airtel reference or bank ref
  notes            text,

  status           payment_status_enum not null default 'pending',

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Prevent duplicate payment records for the same tenant + due month
  constraint no_duplicate_payments unique (tenant_id, due_date)
);

-- Row Level Security
alter table payments enable row level security;

create policy "Landlords can view their own payments"
  on payments for select
  using (auth.uid() = landlord_id);

create policy "Landlords can insert their own payments"
  on payments for insert
  with check (auth.uid() = landlord_id);

create policy "Landlords can update their own payments"
  on payments for update
  using (auth.uid() = landlord_id);

create policy "Landlords can delete their own payments"
  on payments for delete
  using (auth.uid() = landlord_id);

-- Auto-update updated_at
create trigger payments_updated_at
  before update on payments
  for each row execute function update_updated_at();

-- ── Overdue payments view ─────────────────────────────────────────────────
create or replace view overdue_payments as
select
  p.*,
  t.full_name    as tenant_name,
  t.phone        as tenant_phone,
  pr.name        as property_name
from payments p
join tenants    t  on t.id  = p.tenant_id
join properties pr on pr.id = p.property_id
where
  p.status != 'paid'
  and p.due_date < current_date;

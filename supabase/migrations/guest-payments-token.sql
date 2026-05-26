-- Guest payment tokens table
-- Allows landlords/tenants to generate shareable payment links (no login required)

create table if not exists guest_payment_tokens (
  id           uuid primary key default gen_random_uuid(),
  token        text not null unique,
  invoice_id   uuid not null references invoices(id) on delete cascade,
  created_by   uuid references auth.users(id) on delete set null, -- nullable: tenant or landlord
  expires_at   timestamptz not null,
  used_at      timestamptz,                                        -- set on first successful use
  created_at   timestamptz not null default now()
);

create index on guest_payment_tokens(token);
create index on guest_payment_tokens(invoice_id);

-- RLS: only authenticated users can insert tokens
alter table guest_payment_tokens enable row level security;

create policy "Authenticated users can generate tokens"
  on guest_payment_tokens for insert
  with check (auth.uid() is not null);

-- Public read for valid, unexpired tokens (needed for guest page)
create policy "Anyone can read valid tokens"
  on guest_payment_tokens for select
  using (expires_at > now());

-- Add guest payer fields to payments table (if not present)
alter table payments
  add column if not exists guest_name  text,
  add column if not exists guest_phone text,
  add column if not exists is_guest_payment boolean not null default false;
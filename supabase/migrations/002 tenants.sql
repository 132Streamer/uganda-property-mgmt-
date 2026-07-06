-- ============================================================
-- PropertyHub: Tenants table
-- Run AFTER 001_properties.sql
-- ============================================================

create type tenant_status_enum as enum ('active', 'inactive', 'evicted');

create table if not exists tenants (
  id                       uuid primary key default gen_random_uuid(),
  landlord_id              uuid not null references auth.users(id) on delete cascade,
  property_id              uuid not null references properties(id) on delete cascade,

  -- Personal details
  full_name                text not null,
  email                    text,
  phone                    text not null,
  national_id              text,                    -- Uganda NIN e.g. CM90201234XXXXX

  -- Unit & lease
  unit_number              text not null,           -- e.g. "A3", "Unit 5"
  lease_start              date not null,
  lease_end                date,                    -- null = month-to-month
  rent_amount              numeric(12, 0) not null, -- UGX, may differ from property default

  -- Status
  status                   tenant_status_enum not null default 'active',

  -- Emergency contact
  emergency_contact_name   text,
  emergency_contact_phone  text,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- Row Level Security
alter table tenants enable row level security;

create policy "Landlords can view their own tenants"
  on tenants for select
  using (auth.uid() = landlord_id);

create policy "Landlords can insert their own tenants"
  on tenants for insert
  with check (auth.uid() = landlord_id);

create policy "Landlords can update their own tenants"
  on tenants for update
  using (auth.uid() = landlord_id);

create policy "Landlords can delete their own tenants"
  on tenants for delete
  using (auth.uid() = landlord_id);

-- Auto-update updated_at (reuses function from 001_properties.sql)
create trigger tenants_updated_at
  before update on tenants
  for each row execute function update_updated_at();

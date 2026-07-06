-- ============================================================
-- PropertyHub: Properties table
-- Run this in your Supabase SQL Editor
-- ============================================================

create type property_type_enum as enum ('apartment', 'house', 'commercial', 'land');
create type property_status_enum as enum ('available', 'occupied', 'maintenance');

create table if not exists properties (
  id            uuid primary key default gen_random_uuid(),
  landlord_id   uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  address       text not null,
  city          text not null default 'Kampala',
  property_type property_type_enum not null,
  units         integer not null default 1 check (units > 0),
  rent_amount   numeric(12, 0) not null check (rent_amount > 0), -- UGX
  status        property_status_enum not null default 'available',
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Row Level Security: landlords only see their own properties
alter table properties enable row level security;

create policy "Landlords can view their own properties"
  on properties for select
  using (auth.uid() = landlord_id);

create policy "Landlords can insert their own properties"
  on properties for insert
  with check (auth.uid() = landlord_id);

create policy "Landlords can update their own properties"
  on properties for update
  using (auth.uid() = landlord_id);

create policy "Landlords can delete their own properties"
  on properties for delete
  using (auth.uid() = landlord_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger properties_updated_at
  before update on properties
  for each row execute function update_updated_at();

-- Create lease_documents table
create table if not exists public.lease_documents (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  tenant_id    uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  uploaded_at  timestamptz not null default now(),
  unique (property_id, tenant_id)
);

-- Indexes
create index if not exists lease_documents_tenant_id_idx on public.lease_documents(tenant_id);
create index if not exists lease_documents_property_id_idx on public.lease_documents(property_id);

-- Enable RLS
alter table public.lease_documents enable row level security;

-- Landlord insert policy
-- Assumes landlord's user id is stored on the properties table as owner_id
create policy "Landlord can insert lease documents"
  on public.lease_documents
  for insert
  with check (
    exists (
      select 1
      from public.properties p
      where p.id = property_id
        and p.owner_id = auth.uid()
    )
  );

-- Landlord update policy (for upsert / re-uploads)
create policy "Landlord can update lease documents"
  on public.lease_documents
  for update
  using (
    exists (
      select 1
      from public.properties p
      where p.id = property_id
        and p.owner_id = auth.uid()
    )
  );

-- Tenant select policy: only their own row
create policy "Tenant can view own lease document"
  on public.lease_documents
  for select
  using (tenant_id = auth.uid());

-- Storage bucket (run once via Supabase dashboard or this migration)
-- Bucket must be private so signed URLs are required
insert into storage.buckets (id, name, public)
values ('leases', 'leases', false)
on conflict (id) do nothing;

-- Storage RLS: landlord can upload
create policy "Landlord can upload leases"
  on storage.objects
  for insert
  with check (
    bucket_id = 'leases'
    and exists (
      select 1
      from public.properties p
      where p.owner_id = auth.uid()
        -- path format: leases/{propertyId}/{tenantId}/lease.pdf
        and (storage.foldername(name))[1] = 'leases'
        and (storage.foldername(name))[2] = p.id::text
    )
  );

-- Storage RLS: landlord can overwrite (upsert)
create policy "Landlord can update leases"
  on storage.objects
  for update
  using (
    bucket_id = 'leases'
    and exists (
      select 1
      from public.properties p
      where p.owner_id = auth.uid()
        and (storage.foldername(name))[2] = p.id::text
    )
  );

-- Storage RLS: tenant can read only their own object
create policy "Tenant can read own lease"
  on storage.objects
  for select
  using (
    bucket_id = 'leases'
    and (storage.foldername(name))[3] = auth.uid()::text
  );
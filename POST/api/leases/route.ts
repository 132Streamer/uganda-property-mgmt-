import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { computeDaysUntilExpiry, resolveLeaseStatus, validateDateRange } from '@/lib/lease-utils';
import type { CreateLeaseBody, LeaseWithDetails, ApiError } from '@/types/lease';

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = createSupabaseRouteClient(request);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json<ApiError>({ error: 'Profile not found.' }, { status: 404 });
  }
  if (profile.role !== 'landlord') {
    return NextResponse.json<ApiError>({ error: 'Only landlords can create leases.' }, { status: 403 });
  }

  let body: CreateLeaseBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { unit_id, tenant_id, start_date, end_date, rent_amount } = body;

  if (!unit_id || !tenant_id || !start_date || !end_date || rent_amount == null) {
    return NextResponse.json<ApiError>(
      { error: 'Missing required fields: unit_id, tenant_id, start_date, end_date, rent_amount.' },
      { status: 400 }
    );
  }
  if (typeof rent_amount !== 'number' || rent_amount <= 0) {
    return NextResponse.json<ApiError>({ error: 'rent_amount must be a positive number.' }, { status: 400 });
  }
  const dateError = validateDateRange(start_date, end_date);
  if (dateError) {
    return NextResponse.json<ApiError>({ error: dateError }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: tenant, error: tenantError } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', tenant_id)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json<ApiError>({ error: 'Tenant not found.' }, { status: 404 });
  }
  if (tenant.role !== 'tenant') {
    return NextResponse.json<ApiError>({ error: 'Specified user is not a tenant.' }, { status: 400 });
  }

  const { data: unit, error: unitError } = await admin
    .from('units')
    .select('id, status, property_id, properties!inner(landlord_id)')
    .eq('id', unit_id)
    .single();

  if (unitError || !unit) {
    return NextResponse.json<ApiError>({ error: 'Unit not found.' }, { status: 404 });
  }
  const property = unit.properties as unknown as { landlord_id: string };
  if (property.landlord_id !== user.id) {
    return NextResponse.json<ApiError>({ error: 'Unit does not belong to your property.' }, { status: 403 });
  }
  if (unit.status !== 'vacant') {
    return NextResponse.json<ApiError>(
      { error: `Unit is not vacant. Current status: ${unit.status}.` },
      { status: 409 }
    );
  }

  const { data: lease, error: leaseError } = await admin
    .from('leases')
    .insert({ unit_id, tenant_id, start_date, end_date, rent_amount, status: 'active', pdf_path: null })
    .select()
    .single();

  if (leaseError || !lease) {
    console.error('Lease insert error:', leaseError);
    return NextResponse.json<ApiError>({ error: 'Failed to create lease.', details: leaseError?.message }, { status: 500 });
  }

  const { error: unitUpdateError } = await admin
    .from('units')
    .update({ status: 'occupied' })
    .eq('id', unit_id);

  if (unitUpdateError) {
    await admin.from('leases').delete().eq('id', lease.id);
    console.error('Unit update error:', unitUpdateError);
    return NextResponse.json<ApiError>({ error: 'Failed to update unit status.', details: unitUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({ data: lease }, { status: 201 });
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = createSupabaseRouteClient(request);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json<ApiError>({ error: 'Profile not found.' }, { status: 404 });
  }

  const admin = createSupabaseAdminClient();

  // ── Landlord ──
  if (profile.role === 'landlord') {
    const { data: leases, error } = await admin
      .from('leases')
      .select(`
        id, unit_id, tenant_id, start_date, end_date, rent_amount, status, pdf_path, created_at, updated_at,
        units!inner (
          unit_number, property_id,
          properties!inner (
            name, landlord_id,
            profiles!properties_landlord_id_fkey ( full_name, email, phone )
          )
        ),
        tenant:profiles!leases_tenant_id_fkey ( full_name, email, phone )
      `)
      .eq('units.properties.landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Landlord leases fetch error:', error);
      return NextResponse.json<ApiError>({ error: 'Failed to fetch leases.', details: error.message }, { status: 500 });
    }

    const enriched: LeaseWithDetails[] = (leases ?? []).map((l: any) => {
      const unit = l.units;
      const prop = unit?.properties;
      const ll = prop?.profiles;
      return {
        id: l.id, unit_id: l.unit_id, tenant_id: l.tenant_id,
        start_date: l.start_date, end_date: l.end_date,
        rent_amount: l.rent_amount,
        status: resolveLeaseStatus(l.status, l.end_date),
        pdf_path: l.pdf_path, created_at: l.created_at, updated_at: l.updated_at,
        tenant_name: l.tenant?.full_name ?? 'Unknown',
        tenant_email: l.tenant?.email ?? '',
        tenant_phone: l.tenant?.phone ?? null,
        unit_number: unit?.unit_number ?? '',
        property_id: unit?.property_id ?? '',
        property_name: prop?.name ?? '',
        landlord_name: ll?.full_name ?? '',
        landlord_email: ll?.email ?? '',
        landlord_phone: ll?.phone ?? null,
        days_until_expiry: computeDaysUntilExpiry(l.end_date),
      };
    });

    return NextResponse.json({ data: enriched });
  }

  // ── Tenant ──
  if (profile.role === 'tenant') {
    const { data: lease, error } = await admin
      .from('leases')
      .select(`
        id, unit_id, tenant_id, start_date, end_date, rent_amount, status, pdf_path, created_at, updated_at,
        units!inner (
          unit_number, property_id,
          properties!inner (
            name,
            landlord:profiles!properties_landlord_id_fkey ( full_name, email, phone )
          )
        )
      `)
      .eq('tenant_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Tenant lease fetch error:', error);
      return NextResponse.json<ApiError>({ error: 'Failed to fetch lease.', details: error.message }, { status: 500 });
    }
    if (!lease) {
      return NextResponse.json({ data: null, message: 'No active lease found.' });
    }

    const unit = (lease as any).units;
    const prop = unit?.properties;
    const ll = prop?.landlord;

    const enriched: LeaseWithDetails = {
      id: lease.id, unit_id: lease.unit_id, tenant_id: lease.tenant_id,
      start_date: lease.start_date, end_date: lease.end_date,
      rent_amount: lease.rent_amount,
      status: resolveLeaseStatus(lease.status, lease.end_date),
      pdf_path: lease.pdf_path, created_at: lease.created_at, updated_at: lease.updated_at,
      tenant_name: '', tenant_email: '', tenant_phone: null,
      unit_number: unit?.unit_number ?? '',
      property_id: unit?.property_id ?? '',
      property_name: prop?.name ?? '',
      landlord_name: ll?.full_name ?? '',
      landlord_email: ll?.email ?? '',
      landlord_phone: ll?.phone ?? null,
      days_until_expiry: computeDaysUntilExpiry(lease.end_date),
    };

    return NextResponse.json({ data: enriched });
  }

  return NextResponse.json<ApiError>({ error: 'Unknown role.' }, { status: 403 });
}
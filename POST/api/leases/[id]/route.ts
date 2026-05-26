import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { validateDateRange } from '@/lib/lease-utils';
import type { UpdateLeaseBody, ApiError } from '@/types/lease';

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = params;

  if (!id) {
    return NextResponse.json<ApiError>({ error: 'Lease ID is required.' }, { status: 400 });
  }

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
    return NextResponse.json<ApiError>({ error: 'Only landlords can update leases.' }, { status: 403 });
  }

  let body: UpdateLeaseBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { action, new_end_date } = body;

  if (!action || !['renew', 'terminate'].includes(action)) {
    return NextResponse.json<ApiError>({ error: "action must be 'renew' or 'terminate'." }, { status: 400 });
  }
  if (action === 'renew' && !new_end_date) {
    return NextResponse.json<ApiError>({ error: 'new_end_date is required when renewing.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Fetch lease, verify landlord owns it via property
  const { data: lease, error: leaseError } = await admin
    .from('leases')
    .select(`
      id, status, start_date, end_date, unit_id,
      units!inner ( property_id, properties!inner ( landlord_id ) )
    `)
    .eq('id', id)
    .single();

  if (leaseError || !lease) {
    return NextResponse.json<ApiError>({ error: 'Lease not found.' }, { status: 404 });
  }

  const property = (lease as any).units?.properties as { landlord_id: string };
  if (property.landlord_id !== user.id) {
    return NextResponse.json<ApiError>({ error: 'Lease does not belong to your property.' }, { status: 403 });
  }

  if (lease.status === 'terminated') {
    return NextResponse.json<ApiError>({ error: 'Cannot modify a terminated lease.' }, { status: 409 });
  }

  if (action === 'renew') {
    const dateError = validateDateRange(lease.start_date, new_end_date!);
    if (dateError) {
      return NextResponse.json<ApiError>({ error: dateError }, { status: 400 });
    }
    if (new Date(new_end_date!) <= new Date(lease.end_date)) {
      return NextResponse.json<ApiError>(
        { error: 'new_end_date must be after current end_date.' },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await admin
      .from('leases')
      .update({ end_date: new_end_date, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Lease renew error:', updateError);
      return NextResponse.json<ApiError>({ error: 'Failed to renew lease.', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: updated });
  }

  // action === 'terminate'
  const { data: updated, error: terminateError } = await admin
    .from('leases')
    .update({ status: 'terminated', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (terminateError) {
    console.error('Lease terminate error:', terminateError);
    return NextResponse.json<ApiError>({ error: 'Failed to terminate lease.', details: terminateError.message }, { status: 500 });
  }

  // Set unit back to vacant
  const { error: unitError } = await admin
    .from('units')
    .update({ status: 'vacant' })
    .eq('id', lease.unit_id);

  if (unitError) {
    console.error('Unit revert error:', unitError);
    // Lease is already terminated; log but don't fail the response
    return NextResponse.json({
      data: updated,
      warning: 'Lease terminated but unit status could not be reverted to vacant.',
    });
  }

  return NextResponse.json({ data: updated });
}
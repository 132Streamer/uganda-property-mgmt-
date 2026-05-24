import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user is a tenant and fetch their unit
  const { data: tenantProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role, unit_id, property_id')
    .eq('id', user.id)
    .single()

  if (profileError || !tenantProfile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (tenantProfile.role !== 'tenant') {
    return NextResponse.json({ error: 'Only tenants can submit requests' }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, priority, images } = body as {
    title: string
    description: string
    priority: 'low' | 'medium' | 'high' | 'emergency'
    images: string[]
  }

  if (!title || !description || !priority) {
    return NextResponse.json({ error: 'title, description, and priority are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('maintenance_requests')
    .insert({
      tenant_id: user.id,
      unit_id: tenantProfile.unit_id,
      property_id: tenantProfile.property_id,
      title,
      description,
      priority,
      images: images ?? [],
      status: 'open',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, property_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.role === 'tenant') {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('tenant_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  }

  if (profile.role === 'landlord') {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    let query = supabase
      .from('maintenance_requests')
      .select(
        `
        *,
        tenant:profiles!maintenance_requests_tenant_id_fkey (
          id,
          full_name,
          email
        ),
        unit:units (
          id,
          unit_number,
          property:properties (
            id,
            name
          )
        )
      `
      )
      .eq('property_id', profile.property_id)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
}

export async function PATCH(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, property_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'landlord') {
    return NextResponse.json({ error: 'Only landlords can update request status' }, { status: 403 })
  }

  const body = await request.json()
  const { id, status } = body as {
    id: string
    status: 'open' | 'in_progress' | 'resolved'
  }

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
  }

  const validTransitions: Record<string, string[]> = {
    open: ['in_progress'],
    in_progress: ['resolved'],
    resolved: [],
  }

  // Fetch current status first to validate transition
  const { data: existing, error: fetchError } = await supabase
    .from('maintenance_requests')
    .select('status, property_id')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  if (existing.property_id !== profile.property_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!validTransitions[existing.status]?.includes(status)) {
    return NextResponse.json(
      { error: `Invalid transition: ${existing.status} → ${status}` },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('maintenance_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
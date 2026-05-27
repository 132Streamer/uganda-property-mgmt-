import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function createSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: any; value: any; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// Valid enums from schema
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
const VALID_STATUSES   = ['open', 'in_progress', 'resolved', 'closed'] as const

// ─── GET ────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)

  if (profile.role === 'landlord') {
    let query = supabase
      .from('maintenance_requests')
      .select(`
        id, title, description, priority, status, created_at, updated_at,
        tenant:profiles!maintenance_requests_tenant_id_fkey ( id, full_name, phone ),
        property:properties!maintenance_requests_property_id_fkey ( id, title, address )
      `)
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false })

    const filterStatus   = searchParams.get('status')
    const filterPriority = searchParams.get('priority')
    const filterProperty = searchParams.get('property_id')

    if (filterProperty) query = query.eq('property_id', filterProperty)
    if (filterStatus)   query = query.eq('status', filterStatus)
    if (filterPriority) query = query.eq('priority', filterPriority)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  // Tenant: own requests only
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select(`
      id, title, description, priority, status, created_at, updated_at,
      property:properties!maintenance_requests_property_id_fkey ( id, title, address )
    `)
    .eq('tenant_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// ─── POST ───────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'tenant') {
    return NextResponse.json({ error: 'Only tenants can submit requests' }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, priority, property_id, unit_id } = body

  if (!title || !priority || !property_id) {
    return NextResponse.json({ error: 'title, priority, and property_id are required' }, { status: 400 })
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    return NextResponse.json(
      { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` },
      { status: 400 }
    )
  }

  // Verify tenant has an active tenancy on this property
  const { data: tenancy } = await supabase
    .from('tenancies')
    .select('id, landlord_id')
    .eq('tenant_id', user.id)
    .eq('property_id', property_id)
    .eq('status', 'active')
    .single()

  if (!tenancy) {
    return NextResponse.json({ error: 'No active tenancy for this property' }, { status: 403 })
  }

  const { data: newRequest, error: insertError } = await supabase
    .from('maintenance_requests')
    .insert({
      tenant_id:   user.id,
      landlord_id: tenancy.landlord_id,
      property_id,
      unit_id:     unit_id ?? null,
      title,
      description: description ?? null,
      priority,
      status:      'open',
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Email landlord
  const { data: property } = await supabase
    .from('properties')
    .select('title, address, landlord:profiles!properties_landlord_id_fkey ( full_name )')
    .eq('id', property_id)
    .single()

  const landlord = property?.landlord as unknown as { full_name: string } | null

  // Note: landlord email not in profiles — fetch from auth or skip
  // For now we log; wire up email when auth email is accessible
  console.log(`Maintenance request created for landlord ${tenancy.landlord_id}: ${title}`)

  return NextResponse.json({ data: newRequest }, { status: 201 })
}

// ─── PATCH ──────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'landlord') {
    return NextResponse.json({ error: 'Only landlords can update requests' }, { status: 403 })
  }

  const body = await request.json()
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  // Verify landlord owns this request
  const { data: existing } = await supabase
    .from('maintenance_requests')
    .select('id, title, landlord_id')
    .eq('id', id)
    .eq('landlord_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Request not found or forbidden' }, { status: 404 })
  }

  const updatePayload: Record<string, unknown> = { status }
  if (status === 'resolved') updatePayload.resolved_at = new Date().toISOString()

  const { data: updated, error: updateError } = await supabase
    .from('maintenance_requests')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ data: updated })
}
import { createBrowserClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── GET ────────────────────────────────────────────────────────────────────
// Landlord → all requests for their properties
// Tenant   → their own requests
export async function GET(request: NextRequest) {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Fetch profile to determine role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)

  if (profile.role === 'landlord') {
    // Get all properties owned by this landlord
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id')
      .eq('landlord_id', userId)

    if (propError) {
      return NextResponse.json({ error: propError.message }, { status: 500 })
    }

    const propertyIds = properties?.map((p: { id: any }) => p.id) ?? []

    if (propertyIds.length === 0) {
      return NextResponse.json({ data: [] })
    }

    let query = supabase
      .from('maintenance_requests')
      .select(
        `
        id,
        title,
        description,
        priority,
        status,
        photo_url,
        created_at,
        updated_at,
        tenant:profiles!tenant_id (
          id,
          full_name,
          email
        ),
        property:properties!property_id (
          id,
          name,
          address
        )
      `
      )
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false })

    // Optional filters
    const filterProperty = searchParams.get('property_id')
    const filterStatus = searchParams.get('status')
    const filterPriority = searchParams.get('priority')

    if (filterProperty) query = query.eq('property_id', filterProperty)
    if (filterStatus) query = query.eq('status', filterStatus)
    if (filterPriority) query = query.eq('priority', filterPriority)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  }

  // Tenant: own requests only
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select(
      `
      id,
      title,
      description,
      priority,
      status,
      photo_url,
      created_at,
      updated_at,
      property:properties!property_id (
        id,
        name,
        address
      )
    `
    )
    .eq('tenant_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// ─── POST ───────────────────────────────────────────────────────────────────
// Tenant submits a new maintenance request
export async function POST(request: NextRequest) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Verify tenant role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.role !== 'tenant') {
    return NextResponse.json({ error: 'Only tenants can submit requests' }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, priority, property_id, photo_url } = body

  if (!title || !description || !priority || !property_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['Low', 'Medium', 'High', 'Urgent'].includes(priority)) {
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
  }

  // Verify tenant is associated with this property
  const { data: lease, error: leaseError } = await supabase
    .from('leases')
    .select('id, property_id')
    .eq('tenant_id', userId)
    .eq('property_id', property_id)
    .eq('status', 'active')
    .single()

  if (leaseError || !lease) {
    return NextResponse.json({ error: 'No active lease for this property' }, { status: 403 })
  }

  // Insert request
  const { data: newRequest, error: insertError } = await supabase
    .from('maintenance_requests')
    .insert({
      tenant_id: userId,
      property_id,
      title,
      description,
      priority,
      status: 'Open',
      photo_url: photo_url ?? null,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Fetch landlord info for email
  const { data: property } = await supabase
    .from('properties')
    .select('name, address, landlord:profiles!landlord_id (full_name, email)')
    .eq('id', property_id)
    .single()

  const landlord = property?.landlord as unknown as { full_name: string; email: string } | null

  if (landlord?.email) {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: landlord.email,
      subject: `New Maintenance Request — ${title}`,
      html: `
        <h2>New Maintenance Request</h2>
        <p><strong>Property:</strong> ${property?.name} — ${property?.address}</p>
        <p><strong>Tenant:</strong> ${profile.full_name} (${profile.email})</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Description:</strong><br/>${description}</p>
        ${photo_url ? `<p><strong>Photo:</strong> <a href="${photo_url}">View attachment</a></p>` : ''}
        <hr/>
        <p style="color:#888;font-size:12px;">Log in to your dashboard to manage this request.</p>
      `,
    })
  }

  return NextResponse.json({ data: newRequest }, { status: 201 })
}

// ─── PATCH ──────────────────────────────────────────────────────────────────
// Landlord updates request status
export async function PATCH(request: NextRequest) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Verify landlord role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.role !== 'landlord') {
    return NextResponse.json({ error: 'Only landlords can update requests' }, { status: 403 })
  }

  const body = await request.json()
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  }

  if (!['Open', 'In Progress', 'Resolved'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Verify landlord owns the property tied to this request
  const { data: existing, error: fetchError } = await supabase
    .from('maintenance_requests')
    .select(
      `
      id,
      title,
      status,
      property:properties!property_id (
        name,
        address,
        landlord_id
      ),
      tenant:profiles!tenant_id (
        full_name,
        email
      )
    `
    )
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const property = existing.property as unknown as { name: string; address: string; landlord_id: string }

  if (property.landlord_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update
  const { data: updated, error: updateError } = await supabase
    .from('maintenance_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Email tenant
  const tenant = existing.tenant as unknown as { full_name: string; email: string }

  if (tenant?.email) {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: tenant.email,
      subject: `Maintenance Request Update — ${existing.title}`,
      html: `
        <h2>Your Maintenance Request Has Been Updated</h2>
        <p>Hi ${tenant.full_name},</p>
        <p>Your request <strong>"${existing.title}"</strong> for <strong>${property.name}</strong> has been updated.</p>
        <p><strong>New Status:</strong> ${status}</p>
        <hr/>
        <p style="color:#888;font-size:12px;">Log in to your tenant portal to view full details.</p>
      `,
    })
  }

  return NextResponse.json({ data: updated })
}

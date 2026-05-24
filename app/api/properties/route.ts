import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// ─── GET /api/properties ──────────────────────────────────────────────────────
// Public. Supports ?district=&min_price=&max_price=&bedrooms=
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)

  const district  = searchParams.get('district')
  const minPrice  = searchParams.get('min_price')
  const maxPrice  = searchParams.get('max_price')
  const bedrooms  = searchParams.get('bedrooms')

  let query = supabase
    .from('properties')
    .select('*')
    .neq('status', 'unavailable')
    .order('created_at', { ascending: false })

  if (district)             query = query.eq('district', district)
  if (minPrice)             query = query.gte('price_ugx', Number(minPrice))
  if (maxPrice)             query = query.lte('price_ugx', Number(maxPrice))
  if (bedrooms)             query = query.eq('bedrooms', Number(bedrooms))

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// ─── POST /api/properties ─────────────────────────────────────────────────────
// Landlord only. Body: { title, description, location, district, price_ugx, bedrooms, bathrooms }
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify landlord role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'landlord') {
    return NextResponse.json({ error: 'Forbidden: landlords only' }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, location, district, price_ugx, bedrooms, bathrooms } = body

  if (!title || !location || !district || !price_ugx || bedrooms == null || bathrooms == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('properties')
    .insert({
      title,
      description,
      location,
      district,
      price_ugx: Number(price_ugx),
      bedrooms:  Number(bedrooms),
      bathrooms: Number(bathrooms),
      landlord_id: session.user.id,
      status: 'available',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

// ─── PATCH /api/properties ────────────────────────────────────────────────────
// Landlord only, must own the property. Body: { id, ...fields }
export async function PATCH(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Property id required' }, { status: 400 })
  }

  // Ownership check
  const { data: property } = await supabase
    .from('properties')
    .select('landlord_id')
    .eq('id', id)
    .single()

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }
  if (property.landlord_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden: not your property' }, { status: 403 })
  }

  // Whitelist editable fields
  const allowed = ['title', 'description', 'location', 'district', 'price_ugx', 'bedrooms', 'bathrooms', 'status']
  const safeUpdates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in updates) safeUpdates[key] = updates[key]
  }

  const { data, error } = await supabase
    .from('properties')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// ─── DELETE /api/properties ───────────────────────────────────────────────────
// Soft delete — sets status to 'unavailable'. Body: { id }
export async function DELETE(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id } = body

  if (!id) {
    return NextResponse.json({ error: 'Property id required' }, { status: 400 })
  }

  // Ownership check
  const { data: property } = await supabase
    .from('properties')
    .select('landlord_id')
    .eq('id', id)
    .single()

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }
  if (property.landlord_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden: not your property' }, { status: 403 })
  }

  const { error } = await supabase
    .from('properties')
    .update({ status: 'unavailable', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Property removed' })
}
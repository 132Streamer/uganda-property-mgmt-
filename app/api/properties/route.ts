import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { title } from 'process'

const CreatePropertySchema = z.object({
  title: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  district: z.string().min(1, 'District is required'),
  description: z.string().optional(),
  rent_ugx: z.number().positive('Rent must be positive'),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  property_type: z.enum(['apartment', 'house', 'studio', 'commercial', 'land']),
  amenities: z.array(z.string()).optional().default([]),
  photos: z.array(z.string()).optional().default([]),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const district  = searchParams.get('district')
  const bedrooms  = searchParams.get('bedrooms')
  const max_price = searchParams.get('max_price')

  const supabase = await createClient()

  let query = supabase
    .from('properties')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  if (district && district !== 'all') {
    query = query.ilike('district', district)
  }

  if (bedrooms) {
    const bedroomsNum = parseInt(bedrooms)
    if (bedroomsNum === 4) {
      query = query.gte('bedrooms', 4)
    } else {
      query = query.eq('bedrooms', bedroomsNum)
    }
  }

  if (max_price) {
    // FIX: was 'price_ugx' — correct column is 'rent_ugx'
    query = query.lte('rent_ugx', parseInt(max_price))
  }

  const { data, error } = await query

  if (error) {
    console.error('Supabase search error:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }

  return NextResponse.json({ properties: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Verify authenticated landlord
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user has landlord role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'landlord') {
    return NextResponse.json({ error: 'Forbidden: landlords only' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreatePropertySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
  .from('properties')
  .insert({
    landlord_id: user.id,
    title: parsed.data.title,          // was: name
    description: parsed.data.description,
    address: parsed.data.address,
    district: parsed.data.district,
    city: parsed.data.district,        // city is required in DB — using district as fallback
    monthly_rent: parsed.data.rent_ugx, // was: rent_ugx (wrong column name)
    bedrooms: parsed.data.bedrooms,
    bathrooms: parsed.data.bathrooms,
    property_type: parsed.data.property_type,
    photos: parsed.data.photos,
    status: 'available',
  })
  .select()
  .single()

  if (error) {
    console.error('Property creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
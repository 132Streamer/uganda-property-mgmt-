import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const CreatePropertySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  address: z.string().min(1, 'Address is required'),
  district: z.string().min(1, 'District is required'),
  city: z.string().min(1, 'City is required'),
  description: z.string().optional(),
  monthly_rent: z.number().positive('Rent must be positive'),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  property_type: z.string().optional(),
  photos: z.array(z.string()).optional().default([]),
})

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const district  = searchParams.get('district')
  const bedrooms  = searchParams.get('bedrooms')
  const max_price = searchParams.get('max_price')

  const supabase = await createSupabaseClient()

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
    query = query.lte('monthly_rent', parseInt(max_price))
  }

  const { data, error } = await query

  if (error) {
    console.error('Supabase search error:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }

  return NextResponse.json({ properties: data ?? [] })
}

export async function POST(request: NextRequest) {
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
      landlord_id:  user.id,
      title:        parsed.data.title,
      description:  parsed.data.description ?? null,
      address:      parsed.data.address,
      district:     parsed.data.district,
      city:         parsed.data.city,
      monthly_rent: parsed.data.monthly_rent,
      bedrooms:     parsed.data.bedrooms ?? null,
      bathrooms:    parsed.data.bathrooms ?? null,
      property_type: parsed.data.property_type ?? null,
      photos:       parsed.data.photos,
      status:       'available',
    })
    .select()
    .single()

  if (error) {
    console.error('Property creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
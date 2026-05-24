import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const PropertySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  district: z.string().min(1, 'District is required'),
  address: z.string().min(1, 'Address is required'),
  rent_ugx: z.number().positive('Rent must be positive'),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  property_type: z.enum(['apartment', 'house', 'studio', 'commercial', 'land']),
  status: z.enum(['available', 'occupied', 'maintenance']).default('available'),
  amenities: z.array(z.string()).optional().default([]),
  photos: z.array(z.string().url()).optional().default([]),
})

function createSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) { return (await cookieStore).get(name)?.value },
        async set(name: string, value: string, options: Record<string, unknown>) { (await cookieStore).set({ name, value, ...options }) },
        async remove(name: string, options: Record<string, unknown>) { (await cookieStore).set({ name, value: '', ...options }) },
      },
    }
  )
}

export async function GET(request: NextRequest) {
  const supabase = createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const district = searchParams.get('district')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = (page - 1) * limit

  let query = supabase
    .from('properties')
    .select('*, units(count)', { count: 'exact' })
    .eq('landlord_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (district) query = query.ilike('district', `%${district}%`)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
  })
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = PropertySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('properties')
    .insert({ ...parsed.data, landlord_id: user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
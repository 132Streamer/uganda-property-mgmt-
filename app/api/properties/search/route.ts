import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const VALID_PROPERTY_TYPES = ['apartment', 'house', 'studio', 'commercial', 'land'] as const
type PropertyType = (typeof VALID_PROPERTY_TYPES)[number]

function parseIntParam(value: string | null): number | null {
  if (!value) return null
  const n = parseInt(value, 10)
  return isNaN(n) ? null : n
}

function parseFloatParam(value: string | null): number | null {
  if (!value) return null
  const n = parseFloat(value)
  return isNaN(n) ? null : n
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const district   = searchParams.get('district')?.trim() || null
  const minRent    = parseFloatParam(searchParams.get('min_rent'))
  const maxRent    = parseFloatParam(searchParams.get('max_rent'))
  const bedrooms   = parseIntParam(searchParams.get('bedrooms'))
  const typeParam  = searchParams.get('type')?.trim() || null

  const propertyType: PropertyType | null =
    typeParam && VALID_PROPERTY_TYPES.includes(typeParam as PropertyType)
      ? (typeParam as PropertyType)
      : null

  if (typeParam && !propertyType) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${VALID_PROPERTY_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
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

  try {
    // Search available properties — status enum: 'available' | 'occupied' | 'maintenance'
    let query = supabase
      .from('properties')
      .select(`
        id, title, description, district, city, address,
        property_type, bedrooms, bathrooms, monthly_rent, currency,
        photos, status, created_at,
        units ( id, unit_number, floor, status, monthly_rent )
      `)
      .eq('status', 'available')
      .order('created_at', { ascending: false })

    if (district)      query = query.ilike('district', `%${district}%`)
    if (propertyType)  query = query.eq('property_type', propertyType)
    if (bedrooms !== null) query = query.eq('bedrooms', bedrooms)
    if (minRent !== null)  query = query.gte('monthly_rent', minRent)
    if (maxRent !== null)  query = query.lte('monthly_rent', maxRent)

    const { data: properties, error } = await query

    if (error) throw error

    // Attach vacant unit count — correct status value is 'available' not 'vacant'
    const result = (properties ?? []).map((property: any) => {
      const { units, ...rest } = property
      const availableUnits = (units ?? []).filter((u: any) => u.status === 'available')
      return {
        ...rest,
        available_unit_count: availableUnits.length,
        units: availableUnits,
      }
    })

    return NextResponse.json({ data: result, count: result.length })
  } catch (err: any) {
    console.error('[properties/search] error:', err)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}
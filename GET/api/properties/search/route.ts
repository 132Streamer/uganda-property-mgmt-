import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const VALID_PROPERTY_TYPES = ['apartment', 'house', 'commercial'] as const
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

  const district  = searchParams.get('district')?.trim() || null
  const minRent   = parseFloatParam(searchParams.get('min_rent'))
  const maxRent   = parseFloatParam(searchParams.get('max_rent'))
  const bedrooms  = parseIntParam(searchParams.get('bedrooms'))
  const typeParam = searchParams.get('type')?.trim() || null

  // Validate property type
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

  const supabase = createClient()

  try {
    let query = (await supabase)
      .from('properties')
      .select(`
        id,
        title,
        description,
        district,
        address,
        type,
        bedrooms,
        amenities,
        images,
        created_at,
        units!inner (
          id,
          unit_number,
          floor,
          status,
          tenancies (
            monthly_rent_ugx,
            end_date
          )
        )
      `)
      // Only properties that have at least one vacant unit
      .eq('units.status', 'vacant')

    if (district) {
      query = query.ilike('district', district)
    }

    if (propertyType) {
      query = query.eq('type', propertyType)
    }

    if (bedrooms !== null) {
      query = query.eq('bedrooms', bedrooms)
    }

    const { data: properties, error } = await query

    if (error) throw error

    // Filter by rent range — rent lives on tenancies or a base_rent column.
    // Here we assume properties have a base_monthly_rent_ugx column,
    // OR we derive it from the latest tenancy on each vacant unit.
    // Adjust the field name to match your schema.
    let filtered = properties ?? []

    if (minRent !== null || maxRent !== null) {
      filtered = filtered.filter((p: any) => {
        const rent: number = (p as any).base_monthly_rent_ugx ?? 0
        if (minRent !== null && rent < minRent) return false
        if (maxRent !== null && rent > maxRent) return false
        return true
      })
    }

    // Shape response — strip nested tenancies from unit objects
    const result = filtered.map((property: any) => {
      const { units, ...rest } = property as any
      const vacantUnits = (units ?? [])
        .filter((u: any) => u.status === 'vacant')
        .map(({ tenancies: _t, ...unit }: any) => unit)

      return {
        ...rest,
        vacant_unit_count: vacantUnits.length,
        units: vacantUnits,
      }
    })

    return NextResponse.json({ data: result, count: result.length })
  } catch (err: any) {
    console.error('[properties/search] error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}
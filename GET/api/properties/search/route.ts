import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const location    = searchParams.get('location')
  const min_price   = searchParams.get('min_price')
  const max_price   = searchParams.get('max_price')
  const bedrooms    = searchParams.get('bedrooms')
  const availability = searchParams.get('availability')

  try {
    // ── Base query ──────────────────────────────────────────────────────────
    let query = supabase
      .from('properties')
      .select(`
        id,
        title,
        address,
        district,
        division,
        bedrooms,
        bathrooms,
        rent_amount,
        units (
          id,
          status
        ),
        property_photos (
          photo_url,
          is_primary,
          display_order
        )
      `)
      .eq('status', 'active')

    // ── Filters ─────────────────────────────────────────────────────────────
    if (location) {
      query = query.ilike('district', `%${location}%`)
    }

    if (min_price) {
      query = query.gte('rent_amount', Number(min_price))
    }

    if (max_price) {
      query = query.lte('rent_amount', Number(max_price))
    }

    if (bedrooms) {
      const bedroomCount = Number(bedrooms)
      if (bedroomCount >= 4) {
        // "4+" — return all properties with 4 or more bedrooms
        query = query.gte('bedrooms', 4)
      } else {
        query = query.eq('bedrooms', bedroomCount)
      }
    }

    // Order newest first
    query = query.order('created_at', { ascending: false })

    const { data: properties, error } = await query

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch properties', details: error.message },
        { status: 500 }
      )
    }

    // ── Shape the response ──────────────────────────────────────────────────
    const shaped = (properties ?? []).map((property: { property_photos: never[]; units: never[]; id: any; title: any; address: any; district: any; division: any; bedrooms: any; bathrooms: any; rent_amount: any }) => {
      // First image: prefer is_primary, then lowest display_order, then first
      const photos: { photo_url: string; is_primary: boolean; display_order: number }[] =
        property.property_photos ?? []

      const sortedPhotos = [...photos].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        return (a.display_order ?? 0) - (b.display_order ?? 0)
      })

      const firstPhotoUrl = sortedPhotos[0]?.photo_url ?? null

      // Available unit count
      const units: { id: string; status: string }[] = property.units ?? []
      const availableUnits = units.filter((u) => u.status === 'available').length

      // Optionally filter out properties with 0 available units when
      // the caller explicitly requests availability
      if (availability === 'true' && availableUnits === 0) return null

      return {
        id:                  property.id,
        title:               property.title,
        address:             property.address,
        district:            property.district,
        division:            property.division,
        bedrooms:            property.bedrooms,
        bathrooms:           property.bathrooms,
        rent_amount:         property.rent_amount,
        first_photo_url:     firstPhotoUrl,
        available_units:     availableUnits,
      }
    }).filter(Boolean)

    return NextResponse.json(
      { properties: shaped, count: shaped.length },
      { status: 200 }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

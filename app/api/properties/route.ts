import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const district = searchParams.get('district')
  const bedrooms = searchParams.get('bedrooms')
  const max_price = searchParams.get('max_price')

  const supabase = createClient()

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
      // 4+ bedrooms
      query = query.gte('bedrooms', 4)
    } else {
      query = query.eq('bedrooms', bedroomsNum)
    }
  }

  if (max_price) {
    query = query.lte('price_ugx', parseInt(max_price))
  }

  const { data, error } = await query

  if (error) {
    console.error('Supabase search error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }

  return NextResponse.json({ properties: data ?? [] })
}
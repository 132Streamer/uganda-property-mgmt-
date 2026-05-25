import { NextRequest, NextResponse } from 'next/server'
import { requireLandlord } from '@/lib/auth'

interface RouteContext {
  params: { id: string }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { error, session, supabase } = await requireLandlord()
  if (error) return error

  const { id: propertyId } = params

  // Verify property belongs to this landlord
  const { data: property, error: propError } = await supabase!
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('landlord_id', session!.user.id)
    .single()

  if (propError || !property) {
    return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 })
  }

  const body = await req.json()
  const { unit_number, floor, bedrooms, bathrooms, rent_amount, is_available } = body

  if (!unit_number || rent_amount === undefined) {
    return NextResponse.json({ error: 'unit_number and rent_amount are required' }, { status: 400 })
  }

  const { data, error: insertError } = await supabase!
    .from('units')
    .insert({
      property_id: propertyId,
      unit_number,
      floor,
      bedrooms,
      bathrooms,
      rent_amount,
      is_available: is_available ?? true,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
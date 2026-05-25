import { NextRequest, NextResponse } from 'next/server'
import { requireLandlord } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { error, session, supabase } = await requireLandlord()
  if (error) return error

  const body = await req.json()
  const { name, address, city, country, property_type } = body

  if (!name || !address) {
    return NextResponse.json({ error: 'name and address are required' }, { status: 400 })
  }

  const { data, error: insertError } = await supabase!
    .from('properties')
    .insert({
      name,
      address,
      city,
      country,
      property_type,
      landlord_id: session!.user.id,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
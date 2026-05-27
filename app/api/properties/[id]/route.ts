import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const UpdatePropertySchema = z.object({
  title:         z.string().min(1).optional(),
  description:   z.string().optional(),
  district:      z.string().min(1).optional(),
  city:          z.string().min(1).optional(),
  address:       z.string().min(1).optional(),
  monthly_rent:  z.number().positive().optional(),
  bedrooms:      z.number().int().min(0).optional(),
  bathrooms:     z.number().int().min(0).optional(),
  property_type: z.string().optional(),
  status:        z.enum(['available', 'occupied', 'maintenance']).optional(),
  photos:        z.array(z.string()).optional(),
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

type RouteContext = { params: { id: string } }

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      units (
        id, unit_number, floor, monthly_rent, status,
        tenancies (
          id, start_date, end_date, status, monthly_rent,
          tenant:profiles!tenancies_tenant_id_fkey ( id, full_name, phone )
        )
      )
    `)
    .eq('id', params.id)
    .eq('landlord_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const supabase = await createSupabaseClient()

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

  const parsed = UpdatePropertySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('properties')
    .select('id')
    .eq('id', params.id)
    .eq('landlord_id', user.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('properties')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: activeUnits } = await supabase
    .from('units')
    .select('id, tenancies(id, status)')
    .eq('property_id', params.id)

  const hasActiveTenancy = activeUnits?.some(unit =>
    (unit.tenancies as { id: string; status: string }[])?.some(t => t.status === 'active')
  )

  if (hasActiveTenancy) {
    return NextResponse.json({ error: 'Cannot delete property with active tenancies' }, { status: 409 })
  }

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', params.id)
    .eq('landlord_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
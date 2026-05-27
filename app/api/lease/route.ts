import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const BUCKET = 'lease-docs'

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

// POST /api/lease — landlord uploads PDF
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file      = formData.get('file') as File | null
  const tenancyId = formData.get('tenancy_id') as string | null

  if (!file || !tenancyId) {
    return NextResponse.json({ error: 'file and tenancy_id required' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'PDF files only' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 400 })
  }

  // Verify landlord owns this tenancy
  const { data: tenancy, error: tenancyError } = await supabase
    .from('tenancies')
    .select('id, property_id, landlord_id')
    .eq('id', tenancyId)
    .eq('landlord_id', user.id)
    .single()

  if (tenancyError || !tenancy) {
    return NextResponse.json({ error: 'Tenancy not found or forbidden' }, { status: 404 })
  }

  // Get tenant_id for the lease_documents record
  const { data: tenancyFull } = await supabase
    .from('tenancies')
    .select('tenant_id')
    .eq('id', tenancyId)
    .single()

  const fileName = `${tenancyId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, new Uint8Array(arrayBuffer), {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName)

  // Insert into lease_documents — matches schema exactly
  const { data: record, error: dbError } = await supabase
    .from('lease_documents')
    .insert({
      tenancy_id:  tenancyId,
      landlord_id: user.id,
      tenant_id:   tenancyFull?.tenant_id,
      file_url:    publicUrl,
      file_name:   file.name,
    })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from(BUCKET).remove([fileName])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ data: record }, { status: 201 })
}

// GET /api/lease?tenancy_id=xxx — tenant or landlord fetches lease docs
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenancyId = new URL(req.url).searchParams.get('tenancy_id')
  if (!tenancyId) {
    return NextResponse.json({ error: 'tenancy_id required' }, { status: 400 })
  }

  // Verify user belongs to this tenancy (as tenant or landlord)
  const { data: tenancy } = await supabase
    .from('tenancies')
    .select('id, tenant_id, landlord_id')
    .eq('id', tenancyId)
    .single()

  if (!tenancy || (tenancy.tenant_id !== user.id && tenancy.landlord_id !== user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: documents, error } = await supabase
    .from('lease_documents')
    .select('id, file_name, file_url, uploaded_at, created_at')
    .eq('tenancy_id', tenancyId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: documents })
}
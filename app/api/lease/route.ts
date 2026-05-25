import { createServerClient } from "@supabase/ssr";
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const BUCKET = 'lease-docs'

// POST /api/lease — landlord uploads PDF
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
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
    .select('id, property_id')
    .eq('id', tenancyId)
    .single()

  if (tenancyError || !tenancy) {
    return NextResponse.json({ error: 'Tenancy not found' }, { status: 404 })
  }

  const { data: property } = await supabase
    .from('properties')
    .select('id, landlord_id')
    .eq('id', tenancy.property_id)
    .eq('landlord_id', session.user.id)
    .single()

  if (!property) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const fileExt = 'pdf'
  const fileName = `${tenancyId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}.${fileExt}`
  const arrayBuffer = await file.arrayBuffer()
  const fileBuffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, fileBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: record, error: dbError } = await supabase
    .from('lease_documents')
    .insert({
      tenancy_id: tenancyId,
      file_name: file.name,
      storage_path: fileName,
      uploaded_by: session.user.id,
      file_size: file.size,
    })
    .select()
    .single()

  if (dbError) {
    // Rollback storage upload
    await supabase.storage.from(BUCKET).remove([fileName])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ data: record }, { status: 201 })
}

// GET /api/lease?tenancy_id=xxx — tenant fetches their lease docs
export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const tenancyId = searchParams.get('tenancy_id')

  if (!tenancyId) {
    return NextResponse.json({ error: 'tenancy_id required' }, { status: 400 })
  }

  // Verify tenant belongs to this tenancy
  const { data: tenancy } = await supabase
    .from('tenancies')
    .select('id')
    .eq('id', tenancyId)
    .eq('tenant_id', session.user.id)
    .single()

  if (!tenancy) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: documents, error } = await supabase
    .from('lease_documents')
    .select('id, file_name, storage_path, file_size, created_at')
    .eq('tenancy_id', tenancyId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: documents })
}

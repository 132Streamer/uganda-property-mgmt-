import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const BUCKET = 'property-photos'

async function createSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: Record<string, unknown>) { cookieStore.set({ name, value, ...options }) },
        remove(name: string, options: Record<string, unknown>) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({
      error: `File type not allowed. Accepted: jpeg, png, webp`,
    }, { status: 415 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 413 })
  }

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl, path: filename }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path } = await request.json()
  if (!path || !path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
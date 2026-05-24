import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ─── Config ───────────────────────────────────────────────────────────────────

const BUCKET_CONFIG = {
  'property-images': {
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxBytes: 5 * 1024 * 1024, // 5 MB
    public: true,
  },
  'lease-documents': {
    allowedTypes: ['application/pdf'],
    maxBytes: 20 * 1024 * 1024, // 20 MB
    public: false,
  },
} as const

type Bucket = keyof typeof BUCKET_CONFIG

const SIGNED_URL_EXPIRES_IN = 60 * 60 // 1 hour

// ─── Supabase (service role — bypasses RLS for server-side upload) ────────────

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase env vars')
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateBucket(value: string | null): Bucket {
  if (!value || !(value in BUCKET_CONFIG)) {
    throw new ValidationError(
      `Invalid bucket. Must be one of: ${Object.keys(BUCKET_CONFIG).join(', ')}`,
    )
  }
  return value as Bucket
}

function validateFile(file: File, bucket: Bucket): void {
  const config = BUCKET_CONFIG[bucket]

  if (!config.allowedTypes.includes(file.type as never)) {
    throw new ValidationError(
      `File type "${file.type}" not allowed for bucket "${bucket}". ` +
        `Allowed: ${config.allowedTypes.join(', ')}`,
    )
  }

  if (file.size > config.maxBytes) {
    const maxMB = config.maxBytes / (1024 * 1024)
    throw new ValidationError(
      `File exceeds ${maxMB} MB limit (got ${(file.size / 1024 / 1024).toFixed(2)} MB)`,
    )
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const bucketParam = formData.get('bucket')
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bucket = validateBucket(typeof bucketParam === 'string' ? bucketParam : null)
    validateFile(file, bucket)

    const supabase = getSupabaseAdmin()
    const config = BUCKET_CONFIG[bucket]

    // Unique path to prevent collisions
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Public bucket → public URL; private bucket → signed URL
    if (config.public) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filename)
      return NextResponse.json({ url: data.publicUrl, path: filename })
    } else {
      const { data, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filename, SIGNED_URL_EXPIRES_IN)

      if (signedError || !data) {
        return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
      }

      return NextResponse.json({
        url: data.signedUrl,
        path: filename,
        expiresIn: SIGNED_URL_EXPIRES_IN,
      })
    }
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }

    console.error('Unexpected upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
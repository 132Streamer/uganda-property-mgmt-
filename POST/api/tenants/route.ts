import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { requireLandlord } from '@/lib/auth'
import type { Database } from '@/types/supabase'

// Admin client — uses service role key, bypasses RLS
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  const { error, session } = await requireLandlord()
  if (error) return error

  const body = await req.json()
  const { email, first_name, last_name, unit_id } = body

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  // Upsert profile with role=tenant
  const { data: existingUser } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingUser) {
    return NextResponse.json(
      { error: 'User with this email already exists' },
      { status: 409 }
    )
  }

  // Generate magic link via admin API
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      data: {
        role: 'tenant',
        first_name,
        last_name,
        invited_by: session!.user.id,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
    },
  })

  if (linkError || !linkData) {
    return NextResponse.json({ error: linkError?.message ?? 'Failed to generate invite link' }, { status: 500 })
  }

  // Create profile record
  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: linkData.user.id,
    email,
    first_name,
    last_name,
    role: 'tenant',
    invited_by: session!.user.id,
    unit_id: unit_id ?? null,
  })

  if (profileError) {
    // Clean up auth user if profile insert fails
    await supabaseAdmin.auth.admin.deleteUser(linkData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  const magicLink = linkData.properties.action_link

  // Send invite email via Resend
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: "You've been invited as a tenant",
    html: `
      <h2>You've been invited</h2>
      <p>Hi ${first_name ?? 'there'},</p>
      <p>Your landlord has invited you to manage your tenancy online.</p>
      <p>Click below to accept your invite and set up your account:</p>
      <a
        href="${magicLink}"
        style="
          display:inline-block;
          padding:12px 24px;
          background:#4F46E5;
          color:#fff;
          border-radius:6px;
          text-decoration:none;
          font-weight:600;
          margin-top:16px;
        "
      >
        Accept Invite
      </a>
      <p style="margin-top:24px;color:#6B7280;font-size:14px;">
        Link expires in 24 hours. If you weren't expecting this, ignore this email.
      </p>
    `,
  })

  if (emailError) {
    return NextResponse.json({ error: 'User created but email failed to send' }, { status: 500 })
  }

  return NextResponse.json(
    { message: 'Tenant invited successfully', tenant_id: linkData.user.id },
    { status: 201 }
  )
}
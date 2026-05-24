import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

interface InvitePayload {
  email: string
  unit_id: string
  rent_amount_ugx: number
  start_date: string // ISO date string
}

function buildInviteEmail({
  propertyName,
  landlordName,
  rentAmountUgx,
  acceptUrl,
}: {
  propertyName: string
  landlordName: string
  rentAmountUgx: number
  acceptUrl: string
}): string {
  const formattedRent = new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(rentAmountUgx)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Tenancy Invitation</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:36px 48px;">
              <p style="margin:0;color:#c9a84c;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;">Tenancy Invitation</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:normal;letter-spacing:-0.5px;">${propertyName}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;">
              <p style="margin:0 0 24px;color:#444;font-size:16px;line-height:1.7;">
                You've been invited by <strong style="color:#1a1a1a;">${landlordName}</strong> to become a tenant at <strong style="color:#1a1a1a;">${propertyName}</strong>.
              </p>

              <!-- Rent callout -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f2;border-left:3px solid #c9a84c;margin:0 0 32px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;color:#888;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Monthly Rent</p>
                    <p style="margin:0;color:#1a1a1a;font-size:28px;font-weight:bold;font-family:Arial,sans-serif;">${formattedRent}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;color:#555;font-size:15px;line-height:1.7;">
                Accept the invitation to set up your account and access your tenant portal — where you can view payment history, submit maintenance requests, and stay connected with your landlord.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#1a1a1a;border-radius:3px;">
                    <a href="${acceptUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;">Accept Invitation</a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#aaa;font-size:12px;font-family:Arial,sans-serif;">
                Link expires in 7 days. If you weren't expecting this, ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #eeece8;padding:24px 48px;">
              <p style="margin:0;color:#bbb;font-size:11px;font-family:Arial,sans-serif;">
                Sent via <strong style="color:#888;">RentFlow</strong> &middot; ${propertyName}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth: verify caller is a landlord ──────────────────────────────
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user: caller },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify caller has landlord role
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', caller.id)
      .single()

    if (profileError || callerProfile?.role !== 'landlord') {
      return NextResponse.json({ error: 'Forbidden: landlord role required' }, { status: 403 })
    }

    // ── 2. Validate payload ───────────────────────────────────────────────
    const body: InvitePayload = await req.json()
    const { email, unit_id, rent_amount_ugx, start_date } = body

    if (!email || !unit_id || !rent_amount_ugx || !start_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (typeof rent_amount_ugx !== 'number' || rent_amount_ugx <= 0) {
      return NextResponse.json({ error: 'Invalid rent_amount_ugx' }, { status: 400 })
    }

    // ── 3. Fetch unit + property info ─────────────────────────────────────
    const { data: unit, error: unitError } = await supabaseAdmin
      .from('units')
      .select(`
        id,
        unit_number,
        properties (
          id,
          name,
          landlord_id
        )
      `)
      .eq('id', unit_id)
      .single()

    if (unitError || !unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    const property = Array.isArray(unit.properties) ? unit.properties[0] : unit.properties

    // Ensure landlord owns this property
    if (property.landlord_id !== caller.id) {
      return NextResponse.json({ error: 'Forbidden: unit does not belong to your property' }, { status: 403 })
    }

    // ── 4. Check no active tenancy exists on the unit ─────────────────────
    const { data: existingTenancy } = await supabaseAdmin
      .from('tenancies')
      .select('id')
      .eq('unit_id', unit_id)
      .eq('is_active', true)
      .maybeSingle()

    if (existingTenancy) {
      return NextResponse.json({ error: 'Unit already has an active tenancy' }, { status: 409 })
    }

    // ── 5. Create Supabase auth invite ────────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const redirectTo = `${appUrl}/auth/callback?next=/dashboard`

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo,
        data: {
          role: 'tenant',
          invited_by: caller.id,
          unit_id,
        },
      }
    )

    if (inviteError) {
      console.error('[invite] supabase invite error:', inviteError)
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    const invitedUser = inviteData.user

    // ── 6. Upsert profile with tenant role ────────────────────────────────
    // Profile may not exist yet — will be finalised on signup via trigger,
    // but we pre-seed the role so the trigger can read it.
    const { error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: invitedUser.id,
          email,
          role: 'tenant',
          created_at: new Date().toISOString(),
        },
        { onConflict: 'id', ignoreDuplicates: false }
      )

    if (upsertError) {
      console.error('[invite] profile upsert error:', upsertError)
      // Non-fatal — the auth.users trigger will handle this on first login
    }

    // ── 7. Create tenancy record (inactive until tenant accepts) ──────────
    const { data: tenancy, error: tenancyError } = await supabaseAdmin
      .from('tenancies')
      .insert({
        tenant_id: invitedUser.id,
        unit_id,
        landlord_id: caller.id,
        rent_amount_ugx,
        start_date,
        is_active: false,
        invited_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (tenancyError) {
      console.error('[invite] tenancy insert error:', tenancyError)
      return NextResponse.json({ error: 'Failed to create tenancy record' }, { status: 500 })
    }

    // ── 8. Send invite email via Resend ───────────────────────────────────
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@rentflow.app',
      to: email,
      subject: `You've been invited to ${property.name}`,
      html: buildInviteEmail({
        propertyName: property.name,
        landlordName: callerProfile.full_name ?? 'Your Landlord',
        rentAmountUgx: rent_amount_ugx,
        acceptUrl: redirectTo,
      }),
    })

    if (emailError) {
      console.error('[invite] resend error:', emailError)
      // Tenancy + auth invite created — log but don't roll back
    }

    return NextResponse.json(
      {
        message: 'Invitation sent',
        tenancy_id: tenancy.id,
        invited_user_id: invitedUser.id,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[invite] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
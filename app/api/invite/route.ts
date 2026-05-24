import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { tenant_email, property_id, unit_id, monthly_rent, start_date } = await req.json()

    if (!tenant_email || !property_id || !unit_id || !monthly_rent || !start_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const token = uuidv4()
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase.from('invitations').insert({
      token,
      tenant_email,
      property_id,
      unit_id,
      monthly_rent,
      start_date,
      expires_at,
      accepted: false,
    })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`

    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: tenant_email,
      subject: 'You have been invited as a tenant',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Tenant Invitation</h2>
          <p>You have been invited to occupy a rental unit. Click the link below to accept and set up your account.</p>
          <p>
            <a href="${inviteUrl}" style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #1a1a1a;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
            ">
              Accept Invitation
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">Link expires in 7 days.</p>
        </div>
      `,
    })

    if (emailError) {
      console.error('Email error:', emailError)
      return NextResponse.json({ error: 'Failed to send invitation email' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
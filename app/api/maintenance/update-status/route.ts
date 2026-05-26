
import { createBrowserClient } from "@supabase/ssr";
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type MaintenanceStatus = 'submitted' | 'acknowledged' | 'in_progress' | 'resolved'

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  submitted:    'Submitted',
  acknowledged: 'Acknowledged',
  in_progress:  'In Progress',
  resolved:     'Resolved',
}

const STATUS_DESCRIPTIONS: Record<MaintenanceStatus, string> = {
  submitted:    'Your request has been submitted and is awaiting review.',
  acknowledged: 'Your landlord has acknowledged the request and will be in touch.',
  in_progress:  'Work on your request is currently underway.',
  resolved:     'Your maintenance request has been resolved.',
}

export async function PATCH(req: NextRequest) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Verify session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { requestId, status, landlordNote } = body as {
    requestId: string
    status: MaintenanceStatus
    landlordNote?: string
  }

  if (!requestId || !status) {
    return NextResponse.json({ error: 'requestId and status are required' }, { status: 400 })
  }

  const validStatuses: MaintenanceStatus[] = ['submitted', 'acknowledged', 'in_progress', 'resolved']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Fetch request + verify landlord owns the property
  const { data: maintenanceRequest, error: fetchError } = await supabase
    .from('maintenance_requests')
    .select(`
      id,
      title,
      status,
      landlord_note,
      property_id,
      tenant_id,
      properties (
        id,
        name,
        landlord_id
      ),
      profiles:tenant_id (
        id,
        full_name,
        email
      )
    `)
    .eq('id', requestId)
    .single()

  if (fetchError || !maintenanceRequest) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const property = maintenanceRequest.properties as any
  if (property.landlord_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update status
  const updatePayload: Record<string, unknown> = { status }
  if (landlordNote !== undefined) updatePayload.landlord_note = landlordNote

  const { data: updated, error: updateError } = await supabase
    .from('maintenance_requests')
    .update(updatePayload)
    .eq('id', requestId)
    .select()
    .single()

  if (updateError) {
    console.error('Failed to update maintenance request:', updateError)
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }

  // Send email to tenant
  const tenant = maintenanceRequest.profiles as any
  if (tenant?.email) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@yourdomain.com',
        to: tenant.email,
        subject: `Maintenance Update: ${maintenanceRequest.title}`,
        html: buildEmailHtml({
          tenantName:   tenant.full_name ?? 'Tenant',
          requestTitle: maintenanceRequest.title,
          propertyName: property.name,
          status,
          landlordNote,
        }),
      })
    } catch (emailError) {
      // Log but don't fail — status already updated
      console.error('Failed to send status email:', emailError)
    }
  }

  return NextResponse.json({ data: updated })
}

function buildEmailHtml(params: {
  tenantName: string
  requestTitle: string
  propertyName: string
  status: MaintenanceStatus
  landlordNote?: string
}): string {
  const { tenantName, requestTitle, propertyName, status, landlordNote } = params

  const statusColors: Record<MaintenanceStatus, string> = {
    submitted:    '#6B7280',
    acknowledged: '#3B82F6',
    in_progress:  '#F59E0B',
    resolved:     '#10B981',
  }

  const color = statusColors[status]
  const label = STATUS_LABELS[status]
  const description = STATUS_DESCRIPTIONS[status]

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: sans-serif; background: #f9fafb; margin: 0; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="background: #1a1a2e; padding: 24px 32px;">
            <h1 style="color: #fff; margin: 0; font-size: 20px;">Maintenance Update</h1>
            <p style="color: #a0aec0; margin: 4px 0 0; font-size: 14px;">${propertyName}</p>
          </div>
          <div style="padding: 32px;">
            <p style="color: #374151; margin: 0 0 16px;">Hi ${tenantName},</p>
            <p style="color: #374151; margin: 0 0 24px;">
              Status of your request <strong>${requestTitle}</strong> has been updated.
            </p>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">New Status</p>
              <span style="
                display: inline-block;
                background: ${color};
                color: #fff;
                border-radius: 9999px;
                padding: 4px 14px;
                font-size: 14px;
                font-weight: 600;
              ">${label}</span>
              <p style="margin: 12px 0 0; color: #4b5563; font-size: 14px;">${description}</p>
            </div>
            ${landlordNote ? `
            <div style="border-left: 3px solid ${color}; padding: 12px 16px; background: #f9fafb; border-radius: 4px; margin-bottom: 24px;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Note from Landlord</p>
              <p style="margin: 0; color: #374151; font-size: 14px;">${landlordNote}</p>
            </div>
            ` : ''}
            <p style="color: #6b7280; font-size: 13px; margin: 0;">
              Log in to your tenant portal to view full details.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}
// app/api/payments/webhook/route.ts

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getTransactionStatus } from '@/lib/pesapal'
import { Resend } from 'resend'

// Use service-role client — webhook has no user session
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  let body: Record<string, string>

  try {
    body = await req.json()
  } catch {
    // Pesapal may send form-encoded
    const text = await req.text()
    body = Object.fromEntries(new URLSearchParams(text))
  }

  const { orderTrackingId, orderMerchantReference, orderNotificationType } = body

  // Pesapal field names vary slightly — handle both casings
  const trackingId =
    orderTrackingId ?? body.OrderTrackingId ?? body.order_tracking_id
  const merchantRef =
    orderMerchantReference ?? body.OrderMerchantReference ?? body.order_merchant_reference

  if (!trackingId || !merchantRef) {
    return NextResponse.json({ error: 'Missing trackingId or merchantRef' }, { status: 400 })
  }

  // 1. Fetch canonical status from Pesapal
  let statusData: {
    payment_status_description: string
    amount: number
    currency: string
    payment_method: string
    created_date: string
    confirmation_code?: string
  }

  try {
    statusData = await getTransactionStatus(trackingId)
  } catch (err) {
    console.error('GetTransactionStatus error:', err)
    return NextResponse.json({ error: 'Status check failed' }, { status: 502 })
  }

  const pesapalStatus: string = statusData.payment_status_description // COMPLETED | FAILED | REVERSED | PENDING

  const dbStatus =
    pesapalStatus === 'Completed'
      ? 'completed'
      : pesapalStatus === 'Failed' || pesapalStatus === 'Invalid'
      ? 'failed'
      : 'pending' // PENDING / REVERSED — leave pending for retry

  // 2. Fetch existing payment record
  const { data: payment, error: fetchError } = await supabase
    .from('rent_payments')
    .select(`
      id,
      status,
      amount,
      payment_month,
      tenant_id,
      tenant:profiles!rent_payments_tenant_id_fkey (
        full_name,
        email
      )
    `)
    .eq('merchant_reference', merchantRef)
    .single()

  if (fetchError || !payment) {
    console.error('Payment record not found:', merchantRef)
    return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
  }

  // Skip if already in a terminal state
  if (payment.status === 'completed' || payment.status === 'failed') {
    return NextResponse.json({ message: 'Already processed' })
  }

  // 3. Update payment record
  const { error: updateError } = await supabase
    .from('rent_payments')
    .update({
      status: dbStatus,
      pesapal_order_tracking_id: trackingId,
      pesapal_payment_method: statusData.payment_method ?? null,
      pesapal_confirmation_code: statusData.confirmation_code ?? null,
      completed_at: dbStatus === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', payment.id)

  if (updateError) {
    console.error('DB update error:', updateError)
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
  }

  // 4. Send receipt email on success
  if (dbStatus === 'completed') {
    const tenant = payment.tenant as { full_name: string; email: string }

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'receipts@yourdomain.com',
        to: tenant.email,
        subject: `Rent Receipt — ${payment.payment_month}`,
        html: buildReceiptEmail({
          tenantName: tenant.full_name,
          amount: payment.amount,
          paymentMonth: payment.payment_month,
          confirmationCode: statusData.confirmation_code ?? trackingId,
          paymentMethod: statusData.payment_method ?? 'N/A',
          paidAt: new Date().toLocaleString('en-UG', { timeZone: 'Africa/Kampala' }),
        }),
      })
    } catch (emailErr) {
      // Non-fatal — log but don't fail the webhook
      console.error('Receipt email failed:', emailErr)
    }
  }

  // Pesapal expects a 200 with specific body
  return NextResponse.json({ orderNotificationType, orderTrackingId: trackingId, orderMerchantReference: merchantRef, status: '200' })
}

function buildReceiptEmail(opts: {
  tenantName: string
  amount: number
  paymentMonth: string
  confirmationCode: string
  paymentMethod: string
  paidAt: string
}) {
  const formatted = new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(opts.amount)

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:sans-serif;max-width:520px;margin:40px auto;color:#1a1a1a">
  <h2 style="border-bottom:2px solid #16a34a;padding-bottom:8px;color:#16a34a">Payment Receipt</h2>
  <p>Hi ${opts.tenantName},</p>
  <p>Rent payment received. Details below:</p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0">
    <tr><td style="padding:8px 0;color:#666">Month</td><td style="padding:8px 0;font-weight:600">${opts.paymentMonth}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Amount</td><td style="padding:8px 0;font-weight:600">${formatted}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Method</td><td style="padding:8px 0">${opts.paymentMethod}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Reference</td><td style="padding:8px 0;font-family:monospace">${opts.confirmationCode}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Paid at</td><td style="padding:8px 0">${opts.paidAt}</td></tr>
  </table>
  <p style="color:#666;font-size:14px">Keep this email as your proof of payment.</p>
</body>
</html>`
}
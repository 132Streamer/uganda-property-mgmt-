// app/api/payments/initiate/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPesapalToken } from '@/lib/pesapal'

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })

  // 1. Verify authenticated session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // 2. Verify role is tenant
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profileError || profile?.role !== 'tenant') {
    return NextResponse.json({ error: 'Forbidden: tenants only' }, { status: 403 })
  }

  // 3. Fetch active tenancy
  const { data: tenancy, error: tenancyError } = await supabase
    .from('tenancies')
    .select(`
      id,
      monthly_rent,
      due_day,
      unit_id,
      tenant:profiles!tenancies_tenant_id_fkey (
        id,
        full_name,
        email,
        phone
      )
    `)
    .eq('tenant_id', userId)
    .eq('status', 'active')
    .single()

  if (tenancyError || !tenancy) {
    return NextResponse.json({ error: 'No active tenancy found' }, { status: 404 })
  }

  const tenant = tenancy.tenant as {
    id: string
    full_name: string
    email: string
    phone: string
  }

  // 4. Derive payment month
  const now = new Date()
  const paymentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const dueDate = new Date(now.getFullYear(), now.getMonth(), tenancy.due_day)

  // 5. Check no duplicate pending/completed payment this month
  const { data: existing } = await supabase
    .from('rent_payments')
    .select('id, status')
    .eq('tenancy_id', tenancy.id)
    .eq('payment_month', paymentMonth)
    .in('status', ['pending', 'completed'])
    .maybeSingle()

  if (existing?.status === 'completed') {
    return NextResponse.json(
      { error: `Rent for ${paymentMonth} already paid` },
      { status: 409 }
    )
  }

  // 6. Register IPN URL with Pesapal (idempotent — reuse if already registered)
  const token = await getPesapalToken()

  const ipnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`

  // Register IPN
  const ipnRes = await fetch(`${process.env.PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      url: ipnUrl,
      ipn_notification_type: 'POST',
    }),
  })

  if (!ipnRes.ok) {
    const errText = await ipnRes.text()
    return NextResponse.json(
      { error: `IPN registration failed: ${errText}` },
      { status: 502 }
    )
  }

  const ipnData = await ipnRes.json()
  const ipnId = ipnData.ipn_id

  // 7. Create a merchant reference
  const merchantReference = `RENT-${tenancy.id}-${paymentMonth}-${Date.now()}`

  // 8. Submit order to Pesapal
  const orderPayload = {
    id: merchantReference,
    currency: 'UGX',
    amount: tenancy.monthly_rent,
    description: `Rent payment for ${paymentMonth}`,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/callback`,
    notification_id: ipnId,
    billing_address: {
      email_address: tenant.email,
      phone_number: tenant.phone ?? '',
      first_name: tenant.full_name?.split(' ')[0] ?? '',
      last_name: tenant.full_name?.split(' ').slice(1).join(' ') ?? '',
      country_code: 'UG',
    },
  }

  const orderRes = await fetch(
    `${process.env.PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(orderPayload),
    }
  )

  if (!orderRes.ok) {
    const errText = await orderRes.text()
    return NextResponse.json(
      { error: `Pesapal order failed: ${errText}` },
      { status: 502 }
    )
  }

  const orderData = await orderRes.json()

  if (orderData.status !== '200') {
    return NextResponse.json(
      { error: `Pesapal error: ${orderData.message}` },
      { status: 502 }
    )
  }

  // 9. Create rent_payment record
  const { error: insertError } = await supabase.from('rent_payments').upsert(
    {
      ...(existing?.id ? { id: existing.id } : {}),
      tenancy_id: tenancy.id,
      tenant_id: userId,
      amount: tenancy.monthly_rent,
      currency: 'UGX',
      payment_month: paymentMonth,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pending',
      merchant_reference: merchantReference,
      pesapal_order_tracking_id: orderData.order_tracking_id,
    },
    { onConflict: 'merchant_reference' }
  )

  if (insertError) {
    console.error('DB insert error:', insertError)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }

  return NextResponse.json({ redirectUrl: orderData.redirect_url })
}
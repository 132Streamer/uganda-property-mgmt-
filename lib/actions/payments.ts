'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  paymentSchema,
  markPaidSchema,
  deriveStatus,
  type PaymentFormValues,
  type MarkPaidFormValues,
  type PaymentWithRelations,
} from '@/lib/types/payment'

export async function getPayments(): Promise<PaymentWithRelations[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*, tenants(id, full_name, phone, unit_number), properties(id, name, city)')
    .order('due_date', { ascending: false })
  if (error) throw new Error(error.message)
  return data as PaymentWithRelations[]
}

export async function getPaymentsByTenant(tenantId: string): Promise<PaymentWithRelations[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*, tenants(id, full_name, phone, unit_number), properties(id, name, city)')
    .eq('tenant_id', tenantId)
    .order('due_date', { ascending: false })
  if (error) throw new Error(error.message)
  return data as PaymentWithRelations[]
}

export async function getPayment(id: string): Promise<PaymentWithRelations> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*, tenants(id, full_name, phone, unit_number), properties(id, name, city)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data as PaymentWithRelations
}

export async function createPayment(values: PaymentFormValues) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const parsed = paymentSchema.safeParse(values)
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const payload = {
    ...parsed.data,
    landlord_id: user.id,
    payment_method: parsed.data.payment_method ?? null,
    reference_number: parsed.data.reference_number || null,
    notes: parsed.data.notes || null,
    status: deriveStatus({
      amount_due: parsed.data.amount_due,
      amount_paid: parsed.data.amount_paid,
      due_date: parsed.data.due_date,
      paid_at: null,
    }),
  }

  const { error } = await supabase.from('payments').insert(payload)
  if (error) {
    if (error.code === '23505') {
      throw new Error('A payment record already exists for this tenant on that due date.')
    }
    throw new Error(error.message)
  }
  revalidatePath('/landlord/payments')
}

export async function updatePayment(id: string, values: PaymentFormValues) {
  const supabase = await createClient()
  const parsed = paymentSchema.safeParse(values)
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const payload = {
    ...parsed.data,
    payment_method: parsed.data.payment_method ?? null,
    reference_number: parsed.data.reference_number || null,
    notes: parsed.data.notes || null,
    status: deriveStatus({
      amount_due: parsed.data.amount_due,
      amount_paid: parsed.data.amount_paid,
      due_date: parsed.data.due_date,
      paid_at: null,
    }),
  }

  const { error } = await supabase.from('payments').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/landlord/payments')
  revalidatePath(`/landlord/payments/${id}`)
}

export async function markPaymentPaid(id: string, values: MarkPaidFormValues) {
  const supabase = await createClient()
  const parsed = markPaidSchema.safeParse(values)
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const { data: current, error: fetchError } = await supabase
    .from('payments')
    .select('amount_due, due_date')
    .eq('id', id)
    .single()
  if (fetchError) throw new Error(fetchError.message)

  const paidAt = new Date().toISOString()
  const newStatus = deriveStatus({
    amount_due: current.amount_due,
    amount_paid: parsed.data.amount_paid,
    due_date: current.due_date,
    paid_at: paidAt,
  })

  const { error } = await supabase
    .from('payments')
    .update({
      amount_paid: parsed.data.amount_paid,
      payment_method: parsed.data.payment_method,
      reference_number: parsed.data.reference_number || null,
      notes: parsed.data.notes || null,
      paid_at: paidAt,
      status: newStatus,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/landlord/payments')
  revalidatePath(`/landlord/payments/${id}`)
}

export async function deletePayment(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('payments').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/landlord/payments')
}

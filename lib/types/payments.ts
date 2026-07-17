import { z } from 'zod'
import type { Property } from './property'
import type { Tenant } from './tenant'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const PAYMENT_METHODS = [
  'mtn_mobile_money',
  'airtel_money',
  'cash',
  'bank_transfer',
] as const

export const PAYMENT_STATUSES = ['pending', 'paid', 'overdue', 'partial'] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

// ─── DB Row types ─────────────────────────────────────────────────────────────

export interface Payment {
  id: string
  landlord_id: string
  tenant_id: string
  property_id: string
  amount_due: number
  amount_paid: number
  due_date: string
  paid_at: string | null
  payment_method: PaymentMethod | null
  reference_number: string | null
  notes: string | null
  status: PaymentStatus
  created_at: string
  updated_at: string
}

export interface PaymentWithRelations extends Payment {
  tenants: Pick<Tenant, 'id' | 'full_name' | 'phone' | 'unit_number'>
  properties: Pick<Property, 'id' | 'name' | 'city'>
}

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const paymentSchema = z.object({
  tenant_id: z.string().uuid('Please select a tenant'),
  property_id: z.string().uuid('Please select a property'),
  amount_due: z.coerce.number().min(1, 'Amount due must be greater than 0'),
  amount_paid: z.coerce.number().min(0).default(0),
  due_date: z.string().min(1, 'Due date is required'),
  payment_method: z.enum(PAYMENT_METHODS).optional(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
})

export const markPaidSchema = z.object({
  amount_paid: z.coerce.number().min(1, 'Amount paid must be greater than 0'),
  payment_method: z.enum(PAYMENT_METHODS, { required_error: 'Payment method is required' }),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
})

export type PaymentFormValues = z.infer<typeof paymentSchema>
export type MarkPaidFormValues = z.infer<typeof markPaidSchema>

// ─── deriveStatus ────────────────────────────────────────────────────────────

export function deriveStatus(
  payment: Pick<Payment, 'amount_due' | 'amount_paid' | 'due_date' | 'paid_at'>
): PaymentStatus {
  const { amount_due, amount_paid, due_date, paid_at } = payment
  if (paid_at && amount_paid >= amount_due) return 'paid'
  if (amount_paid > 0 && amount_paid < amount_due) return 'partial'
  if (!paid_at && new Date(due_date) < new Date()) return 'overdue'
  return 'pending'
}

// ─── Display helpers ─────────────────────────────────────────────────────────

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  mtn_mobile_money: 'MTN Mobile Money',
  airtel_money: 'Airtel Money',
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
  partial: 'Partial',
}

export const PAYMENT_STATUS_BADGE_VARIANTS: Record<
  PaymentStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  paid: 'default',
  pending: 'secondary',
  overdue: 'destructive',
  partial: 'outline',
}

export function formatDueDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

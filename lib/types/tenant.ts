import { z } from 'zod'
import type { Property } from './property'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const TENANT_STATUSES = ['active', 'inactive', 'evicted'] as const
export type TenantStatus = (typeof TENANT_STATUSES)[number]

// ─── DB Row type ─────────────────────────────────────────────────────────────

export interface Tenant {
  id: string
  landlord_id: string
  property_id: string
  full_name: string
  email: string | null
  phone: string
  national_id: string | null
  unit_number: string
  lease_start: string   // ISO date string
  lease_end: string | null
  rent_amount: number   // UGX
  status: TenantStatus
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  created_at: string
  updated_at: string
}

// Tenant joined with its property name (used in list page)
export interface TenantWithProperty extends Tenant {
  properties: Pick<Property, 'id' | 'name' | 'city'>
}

// ─── Zod Schema ──────────────────────────────────────────────────────────────

export const tenantSchema = z.object({
  property_id: z.string().uuid('Please select a property'),
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(7, 'Phone number is required'),
  national_id: z.string().optional(),
  unit_number: z.string().min(1, 'Unit number is required'),
  lease_start: z.string().min(1, 'Lease start date is required'),
  lease_end: z.string().optional(),
  rent_amount: z.coerce.number().min(1, 'Rent must be greater than 0'),
  status: z.enum(TENANT_STATUSES).default('active'),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
})

export type TenantFormValues = z.infer<typeof tenantSchema>

// ─── Display helpers ─────────────────────────────────────────────────────────

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  evicted: 'Evicted',
}

export const TENANT_STATUS_BADGE_VARIANTS: Record<
  TenantStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  active: 'default',
  inactive: 'secondary',
  evicted: 'destructive',
}

export function leaseLabel(start: string, end: string | null): string {
  const s = new Date(start).toLocaleDateString('en-UG', { month: 'short', year: 'numeric' })
  if (!end) return `From ${s} (month-to-month)`
  const e = new Date(end).toLocaleDateString('en-UG', { month: 'short', year: 'numeric' })
  return `${s} → ${e}`
}

export function isLeaseExpired(end: string | null): boolean {
  if (!end) return false
  return new Date(end) < new Date()
}

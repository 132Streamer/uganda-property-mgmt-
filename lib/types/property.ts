import { z } from 'zod'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const PROPERTY_TYPES = ['apartment', 'house', 'commercial', 'land'] as const
export const PROPERTY_STATUSES = ['available', 'occupied', 'maintenance'] as const

export type PropertyType = (typeof PROPERTY_TYPES)[number]
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number]

// ─── DB Row type ─────────────────────────────────────────────────────────────

export interface Property {
  id: string
  landlord_id: string
  name: string
  address: string
  city: string
  property_type: PropertyType
  units: number
  rent_amount: number // UGX
  status: PropertyStatus
  description: string | null
  created_at: string
  updated_at: string
}

// ─── Zod Schema ──────────────────────────────────────────────────────────────

export const propertySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Please enter a valid address'),
  city: z.string().min(2, 'City is required'),
  property_type: z.enum(PROPERTY_TYPES, { required_error: 'Select a property type' }),
  units: z.coerce.number().int().min(1, 'Must have at least 1 unit'),
  rent_amount: z.coerce.number().min(1, 'Rent must be greater than 0'),
  status: z.enum(PROPERTY_STATUSES).default('available'),
  description: z.string().optional(),
})

export type PropertyFormValues = z.infer<typeof propertySchema>

// ─── Display helpers ─────────────────────────────────────────────────────────

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Apartment',
  house: 'House',
  commercial: 'Commercial',
  land: 'Land',
}

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  maintenance: 'Under Maintenance',
}

export const STATUS_BADGE_VARIANTS: Record<PropertyStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'default',
  occupied: 'secondary',
  maintenance: 'destructive',
}

export function formatUGX(amount: number): string {
  return `UGX ${new Intl.NumberFormat('en-UG').format(amount)}`
}

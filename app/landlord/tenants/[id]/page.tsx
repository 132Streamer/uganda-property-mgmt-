import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  CalendarDays,
  Banknote,
  ShieldAlert,
  CreditCard,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { TenantFormDialog } from '@/components/tenants/tenant-form-dialog'
import { DeleteTenantButton } from '@/components/tenants/delete-tenant-button'
import { getTenant } from '@/lib/actions/tenants'
import { getProperties } from '@/lib/actions/properties'
import {
  TENANT_STATUS_LABELS,
  TENANT_STATUS_BADGE_VARIANTS,
  leaseLabel,
  isLeaseExpired,
} from '@/lib/types/tenant'
import { formatUGX } from '@/lib/types/property'

export const dynamic = 'force-dynamic'

interface TenantDetailPageProps {
  params: { id: string }
}

export default async function TenantDetailPage({ params }: TenantDetailPageProps) {
  let tenant
  let properties: { id: string; name: string; city: string }[] = []

  try {
    ;[tenant, properties] = await Promise.all([getTenant(params.id), getProperties()])
  } catch {
    notFound()
  }

  const expired = isLeaseExpired(tenant.lease_end)

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* ── Back + Actions ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/landlord/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenants
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <TenantFormDialog properties={properties} tenant={tenant} />
          <DeleteTenantButton
            id={tenant.id}
            name={tenant.full_name}
            propertyId={tenant.property_id}
          />
        </div>
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tenant.full_name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Unit {tenant.unit_number} ·{' '}
            <Link
              href={`/landlord/properties/${tenant.property_id}`}
              className="hover:underline"
            >
              {tenant.properties.name}
            </Link>
            , {tenant.properties.city}
          </p>
        </div>
        <Badge variant={TENANT_STATUS_BADGE_VARIANTS[tenant.status]}>
          {TENANT_STATUS_LABELS[tenant.status]}
        </Badge>
      </div>

      {/* ── Contact & Personal ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={`tel:${tenant.phone}`} className="hover:underline">
                {tenant.phone}
              </a>
            </div>
            {tenant.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${tenant.email}`} className="hover:underline">
                  {tenant.email}
                </a>
              </div>
            )}
            {tenant.national_id && (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-xs">{tenant.national_id}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lease & Rent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className={expired ? 'text-destructive' : ''}>
                {leaseLabel(tenant.lease_start, tenant.lease_end)}
                {expired && ' — Expired'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{formatUGX(tenant.rent_amount)} / month</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <Link
                href={`/landlord/properties/${tenant.property_id}`}
                className="hover:underline"
              >
                {tenant.properties.name} — Unit {tenant.unit_number}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Emergency Contact ──────────────────────────────────────────────── */}
      {(tenant.emergency_contact_name || tenant.emergency_contact_phone) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {tenant.emergency_contact_name && (
              <p className="font-medium">{tenant.emergency_contact_name}</p>
            )}
            {tenant.emergency_contact_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${tenant.emergency_contact_phone}`} className="hover:underline">
                  {tenant.emergency_contact_phone}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Placeholder: Payment history ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Payment tracking for this tenant coming soon.
          </p>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Added {new Date(tenant.created_at).toLocaleDateString('en-UG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  )
}

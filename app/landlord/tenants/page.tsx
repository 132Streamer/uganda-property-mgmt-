import { Users, Building2, CalendarClock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { TenantFormDialog } from '@/components/tenants/tenant-form-dialog'
import { DeleteTenantButton } from '@/components/tenants/delete-tenant-button'
import { getTenants } from '@/lib/actions/tenants'
import { getProperties } from '@/lib/actions/properties'
import {
  TENANT_STATUS_LABELS,
  TENANT_STATUS_BADGE_VARIANTS,
  leaseLabel,
  isLeaseExpired,
  type TenantWithProperty,
} from '@/lib/types/tenant'
import { formatUGX } from '@/lib/types/property'

export const dynamic = 'force-dynamic'

export default async function TenantsPage() {
  let tenants: TenantWithProperty[] = []
  let properties: { id: string; name: string; city: string }[] = []
  let fetchError: string | null = null

  try {
    ;[tenants, properties] = await Promise.all([getTenants(), getProperties()])
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load tenants'
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeCount = tenants.filter((t) => t.status === 'active').length
  const expiredLeases = tenants.filter((t) => isLeaseExpired(t.lease_end)).length
  const totalRent = tenants
    .filter((t) => t.status === 'active')
    .reduce((sum, t) => sum + t.rent_amount, 0)

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all tenants across your properties
          </p>
        </div>
        <TenantFormDialog properties={properties} />
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Users className="h-8 w-8 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Active Tenants</p>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">{tenants.length} total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Building2 className="h-8 w-8 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Monthly Rent (Active)</p>
              <p className="text-2xl font-bold">{formatUGX(totalRent)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <CalendarClock
              className={`h-8 w-8 shrink-0 ${expiredLeases > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
            />
            <div>
              <p className="text-sm text-muted-foreground">Expired Leases</p>
              <p className={`text-2xl font-bold ${expiredLeases > 0 ? 'text-destructive' : ''}`}>
                {expiredLeases}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── No properties warning ──────────────────────────────────────────── */}
      {properties.length === 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 p-4 text-sm text-yellow-800 dark:text-yellow-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          You need to add a property before you can add tenants.{' '}
          <Link href="/landlord/properties" className="underline font-medium">
            Add a property →
          </Link>
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────────────────── */}
      {fetchError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {fetchError}
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {!fetchError && tenants.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg">No tenants yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Add your first tenant to get started.
              </p>
            </div>
            <TenantFormDialog properties={properties} />
          </CardContent>
        </Card>
      )}

      {/* ── Tenants Table ──────────────────────────────────────────────────── */}
      {tenants.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <p className="text-sm text-muted-foreground">{tenants.length} tenants</p>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property / Unit</TableHead>
                  <TableHead>Lease</TableHead>
                  <TableHead className="text-right">Rent / Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => {
                  const expired = isLeaseExpired(tenant.lease_end)
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <Link
                          href={`/landlord/tenants/${tenant.id}`}
                          className="font-medium hover:underline"
                        >
                          {tenant.full_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{tenant.phone}</p>
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/landlord/properties/${tenant.property_id}`}
                          className="text-sm hover:underline"
                        >
                          {tenant.properties.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">Unit {tenant.unit_number}</p>
                      </TableCell>

                      <TableCell>
                        <span className={`text-sm ${expired ? 'text-destructive' : ''}`}>
                          {leaseLabel(tenant.lease_start, tenant.lease_end)}
                        </span>
                        {expired && (
                          <p className="text-xs text-destructive font-medium">Expired</p>
                        )}
                      </TableCell>

                      <TableCell className="text-right text-sm">
                        {formatUGX(tenant.rent_amount)}
                      </TableCell>

                      <TableCell>
                        <Badge variant={TENANT_STATUS_BADGE_VARIANTS[tenant.status]}>
                          {TENANT_STATUS_LABELS[tenant.status]}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/landlord/tenants/${tenant.id}`}>View</Link>
                          </Button>
                          <TenantFormDialog properties={properties} tenant={tenant} />
                          <DeleteTenantButton
                            id={tenant.id}
                            name={tenant.full_name}
                            propertyId={tenant.property_id}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

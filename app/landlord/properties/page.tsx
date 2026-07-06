import { Building2, MapPin, Users, Banknote } from 'lucide-react'
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

import { PropertyFormDialog } from '@/components/properties/property-form-dialog'
import { DeletePropertyButton } from '@/components/properties/delete-property-button'
import { getProperties } from '@/lib/actions/properties'
import {
  type Property,
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  STATUS_BADGE_VARIANTS,
  formatUGX,
} from '@/lib/types/property'

export const dynamic = 'force-dynamic'

export default async function PropertiesPage() {
  let properties: Property[] = []
  let fetchError: string | null = null

  try {
    properties = await getProperties()
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load properties'
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalUnits = properties.reduce((sum, p) => sum + p.units, 0)
  const occupiedCount = properties.filter((p) => p.status === 'occupied').length
  const totalRentPotential = properties.reduce((sum, p) => sum + p.rent_amount * p.units, 0)

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your property portfolio
          </p>
        </div>
        <PropertyFormDialog />
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Building2 className="h-8 w-8 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Total Properties</p>
              <p className="text-2xl font-bold">{properties.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Users className="h-8 w-8 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Total Units</p>
              <p className="text-2xl font-bold">{totalUnits}</p>
              <p className="text-xs text-muted-foreground">{occupiedCount} properties occupied</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Banknote className="h-8 w-8 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Potential Monthly Rent</p>
              <p className="text-2xl font-bold">{formatUGX(totalRentPotential)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Error state ────────────────────────────────────────────────────── */}
      {fetchError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {fetchError}
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {!fetchError && properties.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg">No properties yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Add your first property to get started.
              </p>
            </div>
            <PropertyFormDialog />
          </CardContent>
        </Card>
      )}

      {/* ── Properties Table ───────────────────────────────────────────────── */}
      {properties.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <p className="text-sm text-muted-foreground">{properties.length} properties</p>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Rent / Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    {/* Name → links to detail page */}
                    <TableCell>
                      <Link
                        href={`/landlord/properties/${property.id}`}
                        className="font-medium hover:underline"
                      >
                        {property.name}
                      </Link>
                      {property.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">
                          {property.description}
                        </p>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {property.city}
                      </span>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {property.address}
                      </p>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm capitalize">
                        {PROPERTY_TYPE_LABELS[property.property_type]}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">{property.units}</TableCell>

                    <TableCell className="text-right text-sm">
                      {formatUGX(property.rent_amount)}
                    </TableCell>

                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANTS[property.status]}>
                        {PROPERTY_STATUS_LABELS[property.status]}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/landlord/properties/${property.id}`}>View</Link>
                        </Button>
                        <PropertyFormDialog property={property} />
                        <DeletePropertyButton id={property.id} name={property.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

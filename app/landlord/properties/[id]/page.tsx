import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, MapPin, Users, Banknote, CalendarDays } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { PropertyFormDialog } from '@/components/properties/property-form-dialog'
import { DeletePropertyButton } from '@/components/properties/delete-property-button'
import { getProperty } from '@/lib/actions/properties'
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  STATUS_BADGE_VARIANTS,
  formatUGX,
} from '@/lib/types/property'

export const dynamic = 'force-dynamic'

interface PropertyDetailPageProps {
  params: { id: string }
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  let property
  try {
    property = await getProperty(params.id)
  } catch {
    notFound()
  }

  const totalMonthlyRent = property.rent_amount * property.units

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* ── Back + Actions bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/landlord/properties">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <PropertyFormDialog property={property} />
          <DeletePropertyButton id={property.id} name={property.name} />
        </div>
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{property.name}</h1>
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {property.address}, {property.city}
          </p>
        </div>
        <Badge variant={STATUS_BADGE_VARIANTS[property.status]} className="shrink-0">
          {PROPERTY_STATUS_LABELS[property.status]}
        </Badge>
      </div>

      {/* ── Key Metrics ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <Building2 className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="font-semibold">{PROPERTY_TYPE_LABELS[property.property_type]}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <Users className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Units</p>
            <p className="font-semibold">{property.units}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <Banknote className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Rent / Unit</p>
            <p className="font-semibold">{formatUGX(property.rent_amount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <Banknote className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Monthly Total</p>
            <p className="font-semibold">{formatUGX(totalMonthlyRent)}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Details Card ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Full Address</p>
              <p className="font-medium">{property.address}</p>
            </div>
            <div>
              <p className="text-muted-foreground">City / Town</p>
              <p className="font-medium">{property.city}</p>
            </div>
          </div>

          {property.description && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground text-sm mb-1">Description</p>
                <p className="text-sm">{property.description}</p>
              </div>
            </>
          )}

          <Separator />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Added {new Date(property.created_at).toLocaleDateString('en-UG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Placeholder: Tenants linked to this property ───────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tenant management for this property coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

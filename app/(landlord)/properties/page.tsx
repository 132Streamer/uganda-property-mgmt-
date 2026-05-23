import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function PropertiesPage() {
  const properties = [
    {
      id: 1,
      address: '123 Main St',
      city: 'Springfield',
      units: 4,
      occupancy: '75%',
      monthlyIncome: '$4,200',
    },
    {
      id: 2,
      address: '456 Oak Ave',
      city: 'Shelbyville',
      units: 2,
      occupancy: '100%',
      monthlyIncome: '$2,400',
    },
    {
      id: 3,
      address: '789 Elm Rd',
      city: 'Capital City',
      units: 6,
      occupancy: '67%',
      monthlyIncome: '$5,600',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Properties</h1>
          <p className="text-muted-foreground mt-1">Manage your rental properties</p>
        </div>
        <Button>Add Property</Button>
      </div>

      <div className="grid gap-4">
        {properties.map((property) => (
          <Card key={property.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{property.address}</CardTitle>
                  <CardDescription>{property.city}</CardDescription>
                </div>
                <Button variant="outline" size="sm">View Details</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Units</p>
                  <p className="text-lg font-semibold text-foreground">{property.units}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Occupancy</p>
                  <p className="text-lg font-semibold text-foreground">{property.occupancy}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="text-lg font-semibold text-foreground">{property.monthlyIncome}</p>
                </div>
                <div className="flex gap-2 items-end">
                  <Link href={`/landlord/properties/${property.id}`}>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

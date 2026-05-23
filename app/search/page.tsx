import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function SearchPage() {
  const properties = [
    {
      id: 1,
      address: '123 Main St',
      city: 'Springfield',
      bedrooms: 2,
      bathrooms: 1,
      rent: '$1,200',
      image: 'Cozy apartment in downtown',
    },
    {
      id: 2,
      address: '456 Oak Ave',
      city: 'Shelbyville',
      bedrooms: 3,
      bathrooms: 2,
      rent: '$1,800',
      image: 'Spacious family home',
    },
    {
      id: 3,
      address: '789 Elm Rd',
      city: 'Capital City',
      bedrooms: 1,
      bathrooms: 1,
      rent: '$900',
      image: 'Studio apartment, pet friendly',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-foreground">
            PropertyHub
          </Link>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Search Section */}
      <div className="bg-muted/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground mb-8">Find Your Next Home</h1>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Location</label>
              <Input placeholder="City or address" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Bedrooms</label>
              <Input type="number" placeholder="Any" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Max Rent</label>
              <Input type="number" placeholder="Max rent" />
            </div>
            <div className="flex items-end">
              <Button className="w-full">Search</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-foreground mb-8">Available Properties</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-muted h-40 flex items-center justify-center text-muted-foreground">
                {property.image}
              </div>
              <CardHeader>
                <CardTitle>{property.address}</CardTitle>
                <CardDescription>{property.city}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                      <p className="text-lg font-semibold text-foreground">{property.bedrooms}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                      <p className="text-lg font-semibold text-foreground">{property.bathrooms}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Rent</p>
                    <p className="text-xl font-bold text-foreground">{property.rent}</p>
                  </div>
                  <Link href="/login">
                    <Button className="w-full">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

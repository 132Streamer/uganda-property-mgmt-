import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/landlord/properties">
          <Button variant="outline">← Back</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Property Details</h1>
          <p className="text-muted-foreground mt-1">View and manage property information</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Address</label>
                <p className="text-foreground font-medium">123 Main St, Springfield</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Property Type</label>
                <p className="text-foreground font-medium">Multi-unit Apartment</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Year Built</label>
                <p className="text-foreground font-medium">2015</p>
              </div>
              <Button className="w-full">Edit Property</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Units</CardTitle>
              <CardDescription>Manage rental units for this property</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="border border-border rounded p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Unit 101</p>
                    <p className="text-sm text-muted-foreground">$1,200/month - Occupied</p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
                <div className="border border-border rounded p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Unit 102</p>
                    <p className="text-sm text-muted-foreground">$1,200/month - Vacant</p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
                <div className="border border-border rounded p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Unit 103</p>
                    <p className="text-sm text-muted-foreground">$1,200/month - Occupied</p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="text-2xl font-bold text-foreground">4</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Income</p>
                <p className="text-2xl font-bold text-foreground">$3,600</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">View Tenants</Button>
              <Button variant="outline" className="w-full">Maintenance</Button>
              <Button variant="outline" className="w-full">Documents</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

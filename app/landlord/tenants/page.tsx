import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function TenantsPage() {
  const tenants = [
    {
      id: 1,
      name: 'Jane Smith',
      property: '123 Main St - Unit 101',
      rent: '$1,200',
      status: 'Current',
    },
    {
      id: 2,
      name: 'Bob Johnson',
      property: '123 Main St - Unit 102',
      rent: '$1,200',
      status: 'Current',
    },
    {
      id: 3,
      name: 'Alice Williams',
      property: '456 Oak Ave - Unit 1',
      rent: '$1,200',
      status: 'Current',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tenants</h1>
          <p className="text-muted-foreground mt-1">Manage your rental tenants</p>
        </div>
      </div>

      <div className="grid gap-4">
        {tenants.map((tenant) => (
          <Card key={tenant.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{tenant.name}</CardTitle>
                  <CardDescription>{tenant.property}</CardDescription>
                </div>
                <Button variant="outline" size="sm">View Details</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Rent</p>
                  <p className="text-lg font-semibold text-foreground">{tenant.rent}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold text-foreground">{tenant.status}</p>
                </div>
                <div className="flex gap-2 items-end">
                  <Button variant="ghost" size="sm">Contact</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

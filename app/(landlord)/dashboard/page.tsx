import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LandlordDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to your property management dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground mt-1">+2 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">28</div>
            <p className="text-xs text-muted-foreground mt-1">Across all properties</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$24,500</div>
            <p className="text-xs text-muted-foreground mt-1">Collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">3</div>
            <p className="text-xs text-muted-foreground mt-1">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest property and tenant updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-b border-border pb-4 last:border-b-0 last:pb-0">
              <p className="font-medium text-foreground">New tenant application received</p>
              <p className="text-sm text-muted-foreground mt-1">John Doe applied for 123 Main St - 2 hours ago</p>
            </div>
            <div className="border-b border-border pb-4 last:border-b-0 last:pb-0">
              <p className="font-medium text-foreground">Payment received</p>
              <p className="text-sm text-muted-foreground mt-1">$1,200 payment from Jane Smith - Yesterday</p>
            </div>
            <div className="border-b border-border pb-4 last:border-b-0 last:pb-0">
              <p className="font-medium text-foreground">Maintenance request submitted</p>
              <p className="text-sm text-muted-foreground mt-1">Broken window at 456 Oak Ave - 2 days ago</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Manage Properties</CardTitle>
            <CardDescription>Add, edit, or view your properties</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/landlord/properties">
              <Button>Go to Properties</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tenant Management</CardTitle>
            <CardDescription>View and manage your tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/landlord/tenants">
              <Button>Manage Tenants</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function TenantPortal() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tenant Portal</h1>
        <p className="text-muted-foreground mt-1">Manage your rental and stay connected with your landlord</p>
      </div>

      {/* Property Info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Property</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="text-lg font-semibold text-foreground">123 Main St, Unit 101</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Landlord</p>
                <p className="text-lg font-semibold text-foreground">John Property Owner</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lease Term</p>
                <p className="text-lg font-semibold text-foreground">12 months</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="text-lg font-semibold text-foreground">$1,200</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rent Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$1,200</div>
            <p className="text-xs text-muted-foreground mt-1">Due on the 1st</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Days Until Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">8</div>
            <p className="text-xs text-muted-foreground mt-1">Payment due soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1</div>
            <p className="text-xs text-muted-foreground mt-1">Pending maintenance</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/tenant/payments">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader>
              <CardTitle>Pay Rent</CardTitle>
              <CardDescription>Make a payment towards your rent</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Pay Now</Button>
            </CardContent>
          </Card>
        </Link>
        <Link href="/tenant/maintenance">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader>
              <CardTitle>Submit Request</CardTitle>
              <CardDescription>Request maintenance or repairs</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Submit</Button>
            </CardContent>
          </Card>
        </Link>
        <Link href="/tenant/messages">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader>
              <CardTitle>Message Landlord</CardTitle>
              <CardDescription>Send a message to your landlord</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Message</Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Updates about your rental</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-b border-border pb-4 last:border-b-0 last:pb-0">
              <p className="font-medium text-foreground">Rent payment received</p>
              <p className="text-sm text-muted-foreground mt-1">Your $1,200 payment was processed - Yesterday</p>
            </div>
            <div className="border-b border-border pb-4 last:border-b-0 last:pb-0">
              <p className="font-medium text-foreground">Maintenance request approved</p>
              <p className="text-sm text-muted-foreground mt-1">Your request for a new light bulb is scheduled - 2 days ago</p>
            </div>
            <div className="border-b border-border pb-4 last:border-b-0 last:pb-0">
              <p className="font-medium text-foreground">Message from landlord</p>
              <p className="text-sm text-muted-foreground mt-1">The landlord sent you a message about an upcoming inspection - 3 days ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

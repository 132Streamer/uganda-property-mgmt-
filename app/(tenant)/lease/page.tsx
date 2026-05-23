import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TenantLeasePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Lease Agreement</h1>
        <p className="text-muted-foreground mt-1">View your rental lease details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lease Details</CardTitle>
          <CardDescription>123 Main St, Unit 101</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Lease Start Date</p>
              <p className="font-semibold text-foreground">January 1, 2023</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lease End Date</p>
              <p className="font-semibold text-foreground">December 31, 2023</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Rent</p>
              <p className="font-semibold text-foreground">$1,200</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Security Deposit</p>
              <p className="font-semibold text-foreground">$1,200</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lease Term</p>
              <p className="font-semibold text-foreground">12 months</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Renewal Status</p>
              <p className="font-semibold text-foreground">Up for renewal</p>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="font-semibold text-foreground mb-4">Lease Terms</h3>
            <ul className="space-y-2 text-sm text-foreground">
              <li>• Rent is due on the 1st of each month</li>
              <li>• Late fees apply after the 5th of the month</li>
              <li>• Pet policy: No pets without prior approval</li>
              <li>• 30-day notice required for move-out</li>
              <li>• Landlord may enter with 24-hour notice for inspections</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

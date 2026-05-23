import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function MaintenancePage() {
  const requests = [
    {
      id: 1,
      property: '123 Main St - Unit 101',
      tenant: 'Jane Smith',
      issue: 'Broken window',
      status: 'Pending',
      date: '2024-01-15',
    },
    {
      id: 2,
      property: '456 Oak Ave - Unit 1',
      tenant: 'Bob Johnson',
      issue: 'Leaky faucet',
      status: 'In Progress',
      date: '2024-01-14',
    },
    {
      id: 3,
      property: '789 Elm Rd - Unit 3',
      tenant: 'Alice Williams',
      issue: 'HVAC not working',
      status: 'Completed',
      date: '2024-01-10',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Maintenance Requests</h1>
        <p className="text-muted-foreground mt-1">Track and manage maintenance requests</p>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{request.issue}</CardTitle>
                  <CardDescription>{request.property}</CardDescription>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {request.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tenant</p>
                  <p className="font-semibold text-foreground">{request.tenant}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-semibold text-foreground">{request.date}</p>
                </div>
                <div className="flex gap-2 items-end md:col-span-2">
                  <Button variant="outline" size="sm">View Details</Button>
                  <Button variant="outline" size="sm">Update Status</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

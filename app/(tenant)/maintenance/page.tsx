import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function TenantMaintenancePage() {
  const requests = [
    {
      id: 1,
      issue: 'Leaky faucet in bathroom',
      status: 'In Progress',
      date: '2024-01-15',
    },
    {
      id: 2,
      issue: 'Light bulb replacement',
      status: 'Completed',
      date: '2024-01-10',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Maintenance Requests</h1>
        <p className="text-muted-foreground mt-1">Submit and track maintenance requests</p>
      </div>

      {/* Submit New Request */}
      <Card>
        <CardHeader>
          <CardTitle>Submit New Request</CardTitle>
          <CardDescription>Report a maintenance issue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Issue Description
            </label>
            <Textarea placeholder="Describe the maintenance issue..." />
          </div>
          <Button className="w-full">Submit Request</Button>
        </CardContent>
      </Card>

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle>Your Requests</CardTitle>
          <CardDescription>Submitted maintenance requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border border-border rounded p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-foreground">{request.issue}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {request.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Submitted: {request.date}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

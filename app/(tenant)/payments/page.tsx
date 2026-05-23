import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TenantPaymentsPage() {
  const payments = [
    {
      id: 1,
      amount: '$1,200',
      date: '2024-01-01',
      status: 'Paid',
    },
    {
      id: 2,
      amount: '$1,200',
      date: '2023-12-01',
      status: 'Paid',
    },
    {
      id: 3,
      amount: '$1,200',
      date: '2023-11-01',
      status: 'Paid',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground mt-1">Manage your rent payments</p>
      </div>

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Rent</CardTitle>
          <CardDescription>Your upcoming payment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-2xl font-bold text-foreground">$1,200</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="text-2xl font-bold text-foreground">Feb 1, 2024</p>
            </div>
          </div>
          <Button className="w-full">Pay Rent Now</Button>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your previous payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between border-b border-border pb-4 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-medium text-foreground">{payment.date}</p>
                  <p className="text-sm text-muted-foreground">{payment.status}</p>
                </div>
                <p className="font-semibold text-foreground">{payment.amount}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

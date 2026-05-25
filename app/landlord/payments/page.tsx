
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default function PaymentsPage() {
  const payments = [
    {
      id: 1,
      tenant: 'Jane Smith',
      amount: '$1,200',
      date: '2024-01-15',
      status: 'Received',
    },
    {
      id: 2,
      tenant: 'Bob Johnson',
      amount: '$1,200',
      date: '2024-01-14',
      status: 'Received',
    },
    {
      id: 3,
      tenant: 'Alice Williams',
      amount: '$1,200',
      date: '2024-01-10',
      status: 'Pending',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payment Tracking</h1>
        <p className="text-muted-foreground mt-1">Track rent payments from your tenants</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$24,500</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$1,200</div>
            <p className="text-xs text-muted-foreground mt-1">From 1 tenant</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$0</div>
            <p className="text-xs text-muted-foreground mt-1">No overdue payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Payment history and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between border-b border-border pb-4 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-medium text-foreground">{payment.tenant}</p>
                  <p className="text-sm text-muted-foreground">{payment.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-foreground">{payment.amount}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    payment.status === 'Received' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

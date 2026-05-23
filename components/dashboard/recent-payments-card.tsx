import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock } from 'lucide-react'

interface Payment {
  id: string
  tenant: string
  property: string
  amount: number
  date: string
  status: 'paid' | 'pending'
}

interface RecentPaymentsProps {
  payments: Payment[]
  currency?: string
}

export function RecentPaymentsCard({ payments, currency = 'UGX' }: RecentPaymentsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Payments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent payments
            </p>
          ) : (
            payments.map((payment) => (
              <div 
                key={payment.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {payment.tenant}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {payment.property}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.date).toLocaleDateString('en-UG')}
                    </p>
                  </div>
                  {payment.status === 'paid' ? (
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

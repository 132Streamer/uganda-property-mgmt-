'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History } from 'lucide-react'

interface PaymentRecord {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  method?: string
}

interface PaymentHistoryProps {
  payments: PaymentRecord[]
  currency?: string
}

export function PaymentHistoryCard({ payments, currency = 'UGX' }: PaymentHistoryProps) {
  const statusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800'
  }

  const statusLabels: Record<string, string> = {
    paid: 'Paid',
    pending: 'Pending',
    failed: 'Failed'
  }

  const formatCurrency = (amount: number) => {
    if (currency === 'UGX') {
      return `${(amount / 1000000).toFixed(1)}M`
    }
    return `$${amount.toLocaleString()}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Method</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8">
                    <p className="text-muted-foreground">No payment history yet</p>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                    <td className="py-3 px-3 text-foreground font-medium">{payment.date}</td>
                    <td className="py-3 px-3 font-semibold text-foreground">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground capitalize">
                      {payment.method || 'Mobile Money'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge className={statusColors[payment.status]}>
                        {statusLabels[payment.status]}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

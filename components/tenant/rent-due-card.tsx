'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, AlertCircle } from 'lucide-react'

interface RentDueProps {
  rentAmount: number
  dueDate: string
  currency?: string
  status?: 'paid' | 'pending' | 'overdue'
}

export function RentDueCard({
  rentAmount,
  dueDate,
  currency = 'UGX',
  status = 'pending'
}: RentDueProps) {
  const statusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800'
  }

  const statusLabels: Record<string, string> = {
    paid: 'Paid',
    pending: 'Due Soon',
    overdue: 'Overdue'
  }

  const formatCurrency = (amount: number) => {
    if (currency === 'UGX') {
      return `${(amount / 1000000).toFixed(1)}M`
    }
    return `$${amount.toLocaleString()}`
  }

  return (
    <Card className={`${status === 'overdue' ? 'border-red-200 bg-red-50/30' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Current Rent Due
        </CardTitle>
        <Badge className={statusColors[status]}>
          {statusLabels[status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Amount Due</p>
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(rentAmount)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="font-semibold text-foreground">{dueDate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Currency</p>
            <p className="font-semibold text-foreground">{currency}</p>
          </div>
        </div>
        {status === 'overdue' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 mt-3">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-800">Payment is overdue. Please pay immediately.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

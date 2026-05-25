import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function PaymentsPage() {
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
            <div className="text-2xl font-bold text-foreground">UGX 0</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">UGX 0</div>
            <p className="text-xs text-muted-foreground mt-1">No pending payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">UGX 0</div>
            <p className="text-xs text-muted-foreground mt-1">No overdue payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Payment history and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
              <CreditCard className="w-7 h-7 text-stone-300" />
            </div>
            <h3 className="font-semibold text-stone-800 mb-1">No payments yet</h3>
            <p className="text-stone-400 text-sm max-w-xs">
              Payments will appear here once tenants start paying rent via Mobile Money.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
import { Banknote, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { PaymentFormDialog } from '@/components/payments/payment-form-dialog'
import { MarkPaidButton } from '@/components/payments/mark-paid-button'
import { DeletePaymentButton } from '@/components/payments/delete-payment-button'
import { getPayments } from '@/lib/actions/payments'
import { getTenants } from '@/lib/actions/tenants'
import { getProperties } from '@/lib/actions/properties'
import {
  deriveStatus,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_BADGE_VARIANTS,
  PAYMENT_METHOD_LABELS,
  formatDueDate,
  type PaymentWithRelations,
} from '@/lib/types/payment'
import { formatUGX } from '@/lib/types/property'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  let payments: PaymentWithRelations[] = []
  let tenants: { id: string; full_name: string; unit_number: string; property_id: string; rent_amount: number }[] = []
  let properties: { id: string; name: string }[] = []
  let fetchError: string | null = null

  try {
    const [rawPayments, rawTenants, rawProperties] = await Promise.all([
      getPayments(),
      getTenants(),
      getProperties(),
    ])
    // Re-derive status on the fly so the UI is always accurate
    payments = rawPayments.map((p) => ({ ...p, status: deriveStatus(p) }))
    tenants = rawTenants
    properties = rawProperties
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load payments'
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const overduePayments = payments.filter((p) => p.status === 'overdue')
  const paidThisMonth = payments.filter((p) => {
    if (p.status !== 'paid' || !p.paid_at) return false
    const paidDate = new Date(p.paid_at)
    const now = new Date()
    return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear()
  })
  const totalCollected = paidThisMonth.reduce((sum, p) => sum + p.amount_paid, 0)
  const totalOutstanding = payments
    .filter((p) => p.status !== 'paid')
    .reduce((sum, p) => sum + (p.amount_due - p.amount_paid), 0)

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track rent collections across all properties
          </p>
        </div>
        <PaymentFormDialog tenants={tenants} properties={properties} />
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Collected This Month</p>
              <p className="text-2xl font-bold">{formatUGX(totalCollected)}</p>
              <p className="text-xs text-muted-foreground">{paidThisMonth.length} payments</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Clock className="h-8 w-8 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold">{formatUGX(totalOutstanding)}</p>
              <p className="text-xs text-muted-foreground">
                {payments.filter((p) => p.status !== 'paid').length} unpaid records
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <AlertTriangle
              className={`h-8 w-8 shrink-0 ${overduePayments.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
            />
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className={`text-2xl font-bold ${overduePayments.length > 0 ? 'text-destructive' : ''}`}>
                {overduePayments.length}
              </p>
              {overduePayments.length > 0 && (
                <p className="text-xs text-destructive">
                  {formatUGX(overduePayments.reduce((s, p) => s + p.amount_due - p.amount_paid, 0))} owed
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Overdue alert strip ────────────────────────────────────────────── */}
      {overduePayments.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {overduePayments.length} overdue payment{overduePayments.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-1">
            {overduePayments.slice(0, 3).map((p) => (
              <p key={p.id} className="text-xs text-destructive">
                {p.tenants.full_name} — {formatUGX(p.amount_due)} due{' '}
                {formatDueDate(p.due_date)}
              </p>
            ))}
            {overduePayments.length > 3 && (
              <p className="text-xs text-destructive">
                +{overduePayments.length - 3} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────────────────── */}
      {fetchError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {fetchError}
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {!fetchError && payments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <Banknote className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg">No payment records yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Record a payment to start tracking rent collection.
              </p>
            </div>
            <PaymentFormDialog tenants={tenants} properties={properties} />
          </CardContent>
        </Card>
      )}

      {/* ── Payments Table ─────────────────────────────────────────────────── */}
      {payments.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <p className="text-sm text-muted-foreground">{payments.length} records</p>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Link
                        href={`/landlord/tenants/${payment.tenant_id}`}
                        className="font-medium hover:underline"
                      >
                        {payment.tenants.full_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Unit {payment.tenants.unit_number}
                      </p>
                    </TableCell>

                    <TableCell>
                      <Link
                        href={`/landlord/properties/${payment.property_id}`}
                        className="text-sm hover:underline"
                      >
                        {payment.properties.name}
                      </Link>
                    </TableCell>

                    <TableCell className="text-sm">
                      <span className={payment.status === 'overdue' ? 'text-destructive font-medium' : ''}>
                        {formatDueDate(payment.due_date)}
                      </span>
                    </TableCell>

                    <TableCell className="text-right text-sm">
                      {formatUGX(payment.amount_due)}
                    </TableCell>

                    <TableCell className="text-right text-sm">
                      {payment.amount_paid > 0 ? formatUGX(payment.amount_paid) : '—'}
                    </TableCell>

                    <TableCell className="text-sm">
                      {payment.payment_method
                        ? PAYMENT_METHOD_LABELS[payment.payment_method]
                        : '—'}
                    </TableCell>

                    <TableCell>
                      <Badge variant={PAYMENT_STATUS_BADGE_VARIANTS[payment.status]}>
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {payment.status !== 'paid' && (
                          <MarkPaidButton
                            paymentId={payment.id}
                            amountDue={payment.amount_due}
                            tenantName={payment.tenants.full_name}
                          />
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/landlord/payments/${payment.id}`}>View</Link>
                        </Button>
                        <PaymentFormDialog
                          tenants={tenants}
                          properties={properties}
                          payment={payment}
                        />
                        <DeletePaymentButton
                          id={payment.id}
                          tenantName={payment.tenants.full_name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

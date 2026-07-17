import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Building2,
  User,
  Hash,
  FileText,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { MarkPaidButton } from '@/components/payments/mark-paid-button'
import { PaymentFormDialog } from '@/components/payments/payment-form-dialog'
import { DeletePaymentButton } from '@/components/payments/delete-payment-button'
import { getPayment } from '@/lib/actions/payments'
import { getTenants } from '@/lib/actions/tenants'
import { getProperties } from '@/lib/actions/properties'
import {
  deriveStatus,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_BADGE_VARIANTS,
  PAYMENT_METHOD_LABELS,
  formatDueDate,
} from '@/lib/types/payment'
import { formatUGX } from '@/lib/types/property'

export const dynamic = 'force-dynamic'

interface PaymentDetailPageProps {
  params: { id: string }
}

export default async function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  let payment, tenants, properties

  try {
    ;[payment, tenants, properties] = await Promise.all([
      getPayment(params.id),
      getTenants(),
      getProperties(),
    ])
  } catch {
    notFound()
  }

  const status = deriveStatus(payment)
  const balance = payment.amount_due - payment.amount_paid

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* ── Back + Actions ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/landlord/payments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payments
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {status !== 'paid' && (
            <MarkPaidButton
              paymentId={payment.id}
              amountDue={payment.amount_due}
              tenantName={payment.tenants.full_name}
            />
          )}
          <PaymentFormDialog tenants={tenants} properties={properties} payment={payment} />
          <DeletePaymentButton id={payment.id} tenantName={payment.tenants.full_name} />
        </div>
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Payment — {payment.tenants.full_name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Due {formatDueDate(payment.due_date)} ·{' '}
            <Link
              href={`/landlord/properties/${payment.property_id}`}
              className="hover:underline"
            >
              {payment.properties.name}
            </Link>
          </p>
        </div>
        <Badge variant={PAYMENT_STATUS_BADGE_VARIANTS[status]}>
          {PAYMENT_STATUS_LABELS[status]}
        </Badge>
      </div>

      {/* ── Amount summary ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Amount Due</p>
            <p className="text-xl font-bold mt-1">{formatUGX(payment.amount_due)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Amount Paid</p>
            <p className={`text-xl font-bold mt-1 ${payment.amount_paid > 0 ? 'text-green-700 dark:text-green-400' : ''}`}>
              {payment.amount_paid > 0 ? formatUGX(payment.amount_paid) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className={`text-xl font-bold mt-1 ${balance > 0 ? 'text-destructive' : ''}`}>
              {balance > 0 ? formatUGX(balance) : 'Cleared'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Details ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Tenant</p>
                <Link
                  href={`/landlord/tenants/${payment.tenant_id}`}
                  className="font-medium hover:underline"
                >
                  {payment.tenants.full_name}
                </Link>
                <p className="text-xs text-muted-foreground">Unit {payment.tenants.unit_number}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Property</p>
                <Link
                  href={`/landlord/properties/${payment.property_id}`}
                  className="font-medium hover:underline"
                >
                  {payment.properties.name}
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="font-medium">{formatDueDate(payment.due_date)}</p>
              </div>
            </div>

            {payment.paid_at && (
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Paid On</p>
                  <p className="font-medium">
                    {new Date(payment.paid_at).toLocaleDateString('en-UG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}

            {payment.payment_method && (
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Method</p>
                  <p className="font-medium">{PAYMENT_METHOD_LABELS[payment.payment_method]}</p>
                </div>
              </div>
            )}

            {payment.reference_number && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Reference</p>
                  <p className="font-mono font-medium">{payment.reference_number}</p>
                </div>
              </div>
            )}
          </div>

          {payment.notes && (
            <>
              <Separator />
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p>{payment.notes}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Created{' '}
        {new Date(payment.created_at).toLocaleDateString('en-UG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  )
}

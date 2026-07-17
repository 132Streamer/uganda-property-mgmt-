'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

import {
  paymentSchema,
  type PaymentFormValues,
  type PaymentWithRelations,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/types/payment'
import { formatUGX } from '@/lib/types/property'
import type { Tenant } from '@/lib/types/tenant'
import { createPayment, updatePayment } from '@/lib/actions/payments'

interface PaymentFormDialogProps {
  tenants: Pick<Tenant, 'id' | 'full_name' | 'unit_number' | 'property_id' | 'rent_amount'>[]
  properties: { id: string; name: string }[]
  payment?: PaymentWithRelations
  /** Pre-select tenant (e.g. from tenant detail page) */
  defaultTenantId?: string
  trigger?: React.ReactNode
}

export function PaymentFormDialog({
  tenants,
  properties,
  payment,
  defaultTenantId,
  trigger,
}: PaymentFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEditing = !!payment

  // Default due date = 1st of next month
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  nextMonth.setDate(1)
  const defaultDueDate = nextMonth.toISOString().split('T')[0]

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: payment
      ? {
          tenant_id: payment.tenant_id,
          property_id: payment.property_id,
          amount_due: payment.amount_due,
          amount_paid: payment.amount_paid,
          due_date: payment.due_date,
          payment_method: payment.payment_method ?? undefined,
          reference_number: payment.reference_number ?? '',
          notes: payment.notes ?? '',
        }
      : {
          tenant_id: defaultTenantId ?? '',
          property_id: '',
          amount_due: 0,
          amount_paid: 0,
          due_date: defaultDueDate,
          reference_number: '',
          notes: '',
        },
  })

  // When tenant changes, auto-fill property + amount from their record
  function handleTenantChange(tenantId: string) {
    form.setValue('tenant_id', tenantId)
    const tenant = tenants.find((t) => t.id === tenantId)
    if (tenant) {
      form.setValue('property_id', tenant.property_id)
      form.setValue('amount_due', tenant.rent_amount)
    }
  }

  function onSubmit(values: PaymentFormValues) {
    startTransition(async () => {
      try {
        if (isEditing) {
          await updatePayment(payment.id, values)
          toast.success('Payment updated')
        } else {
          await createPayment(values)
          toast.success('Payment record created')
          form.reset()
        }
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          isEditing ? (
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Payment' : 'Record Payment'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update this payment record.'
              : 'Create a new payment record for a tenant.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Tenant & Property ───────────────────────────────────── */}
            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
                  <Select
                    onValueChange={handleTenantChange}
                    defaultValue={field.value}
                    disabled={tenants.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          tenants.length === 0 ? 'No tenants yet' : 'Select tenant'
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.full_name}
                          <span className="text-muted-foreground ml-1">· Unit {t.unit_number}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="property_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* ── Amounts & Due Date ──────────────────────────────────── */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Amounts & Due Date
            </p>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount_due"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Due (UGX)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount_paid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid (UGX)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* ── Payment Details ─────────────────────────────────────── */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Payment Details (optional)
            </p>

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {PAYMENT_METHOD_LABELS[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. MTN ref: 1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || tenants.length === 0}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

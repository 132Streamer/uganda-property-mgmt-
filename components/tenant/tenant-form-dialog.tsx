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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

import {
  tenantSchema,
  type TenantFormValues,
  type TenantWithProperty,
  TENANT_STATUSES,
  TENANT_STATUS_LABELS,
} from '@/lib/types/tenant'
import type { Property } from '@/lib/types/property'
import { createTenant, updateTenant } from '@/lib/actions/tenants'
import { formatUGX } from '@/lib/types/property'

// ─── Props ───────────────────────────────────────────────────────────────────

interface TenantFormDialogProps {
  /** List of the landlord's properties for the property selector */
  properties: Pick<Property, 'id' | 'name' | 'city'>[]
  /** Pass an existing tenant to switch to edit mode */
  tenant?: TenantWithProperty
  /** Pre-select a property (e.g. when adding from a property detail page) */
  defaultPropertyId?: string
  trigger?: React.ReactNode
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TenantFormDialog({
  properties,
  tenant,
  defaultPropertyId,
  trigger,
}: TenantFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEditing = !!tenant

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: tenant
      ? {
          property_id: tenant.property_id,
          full_name: tenant.full_name,
          email: tenant.email ?? '',
          phone: tenant.phone,
          national_id: tenant.national_id ?? '',
          unit_number: tenant.unit_number,
          lease_start: tenant.lease_start,
          lease_end: tenant.lease_end ?? '',
          rent_amount: tenant.rent_amount,
          status: tenant.status,
          emergency_contact_name: tenant.emergency_contact_name ?? '',
          emergency_contact_phone: tenant.emergency_contact_phone ?? '',
        }
      : {
          property_id: defaultPropertyId ?? '',
          full_name: '',
          email: '',
          phone: '',
          national_id: '',
          unit_number: '',
          lease_start: new Date().toISOString().split('T')[0],
          lease_end: '',
          rent_amount: 0,
          status: 'active',
          emergency_contact_name: '',
          emergency_contact_phone: '',
        },
  })

  // Auto-fill rent from selected property
  const selectedPropertyId = form.watch('property_id')
  function handlePropertyChange(id: string) {
    form.setValue('property_id', id)
    if (!isEditing) {
      const prop = properties.find((p) => p.id === id)
      // We don't have rent_amount here (it's on the full Property type),
      // so we leave this as a hint for the user to fill in.
      if (prop) form.setFocus('unit_number')
    }
  }

  function onSubmit(values: TenantFormValues) {
    startTransition(async () => {
      try {
        if (isEditing) {
          await updateTenant(tenant.id, values)
          toast.success('Tenant updated successfully')
        } else {
          await createTenant(values)
          toast.success('Tenant added successfully')
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
              Add Tenant
            </Button>
          )
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update this tenant's details.'
              : 'Fill in the details to add a new tenant.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Property & Unit ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="property_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select
                      onValueChange={handlePropertyChange}
                      defaultValue={field.value}
                      disabled={properties.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            properties.length === 0 ? 'No properties yet' : 'Select property'
                          } />
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

              <FormField
                control={form.control}
                name="unit_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. A3, Unit 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* ── Personal Details ────────────────────────────────────── */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Personal Details
            </p>

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Aisha Nakamya" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+256 7XX XXX XXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="tenant@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="national_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>National ID / NIN (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. CM90201234XXXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* ── Lease & Rent ────────────────────────────────────────── */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Lease & Rent
            </p>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lease_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lease Start</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lease_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lease End (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rent_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Rent (UGX)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="e.g. 500000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TENANT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {TENANT_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* ── Emergency Contact ───────────────────────────────────── */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Emergency Contact (optional)
            </p>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergency_contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergency_contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+256 7XX XXX XXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || properties.length === 0}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Add Tenant'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

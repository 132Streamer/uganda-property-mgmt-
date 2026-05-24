'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserPlus, Building2, CalendarDays, Banknote, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Unit {
  id: string
  unit_number: string
  property_name: string
}

interface Tenant {
  tenancy_id: string
  tenant_email: string
  tenant_name: string | null
  unit_number: string
  property_name: string
  rent_amount_ugx: number
  start_date: string
  is_active: boolean
  invited_at: string
}

interface InviteForm {
  email: string
  unit_id: string
  rent_amount_ugx: string
  start_date: string
}

const EMPTY_FORM: InviteForm = {
  email: '',
  unit_id: '',
  rent_amount_ugx: '',
  start_date: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUGX(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const supabase = createClientComponentClient()

  const [tenants, setTenants] = useState<Tenant[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<InviteForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function fetchTenants() {
    const { data, error } = await supabase
      .from('tenancies')
      .select(`
        id,
        rent_amount_ugx,
        start_date,
        is_active,
        invited_at,
        units (
          unit_number,
          properties ( name )
        ),
        profiles (
          email,
          full_name
        )
      `)
      .order('invited_at', { ascending: false })

    if (error) {
      toast.error('Failed to load tenants')
      return
    }

    const mapped: Tenant[] = (data ?? []).map((row: any) => {
      const unit = Array.isArray(row.units) ? row.units[0] : row.units
      const property = Array.isArray(unit?.properties) ? unit.properties[0] : unit?.properties
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles

      return {
        tenancy_id: row.id,
        tenant_email: profile?.email ?? '—',
        tenant_name: profile?.full_name ?? null,
        unit_number: unit?.unit_number ?? '—',
        property_name: property?.name ?? '—',
        rent_amount_ugx: row.rent_amount_ugx,
        start_date: row.start_date,
        is_active: row.is_active,
        invited_at: row.invited_at,
      }
    })

    setTenants(mapped)
  }

  async function fetchUnits() {
    // Only show units without an active tenancy
    const { data, error } = await supabase
      .from('units')
      .select(`
        id,
        unit_number,
        properties ( name )
      `)
      .not(
        'id',
        'in',
        `(select unit_id from tenancies where is_active = true)`
      )

    if (error) {
      toast.error('Failed to load units')
      return
    }

    const mapped: Unit[] = (data ?? []).map((row: any) => {
      const property = Array.isArray(row.properties) ? row.properties[0] : row.properties
      return {
        id: row.id,
        unit_number: row.unit_number,
        property_name: property?.name ?? '—',
      }
    })

    setUnits(mapped)
  }

  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([fetchTenants(), fetchUnits()])
      setLoading(false)
    }
    init()
  }, [])

  // ── Invite submission ──────────────────────────────────────────────────────

  async function handleInvite() {
    if (!form.email || !form.unit_id || !form.rent_amount_ugx || !form.start_date) {
      toast.error('All fields are required')
      return
    }

    const rentNum = Number(form.rent_amount_ugx)
    if (isNaN(rentNum) || rentNum <= 0) {
      toast.error('Enter a valid rent amount')
      return
    }

    setSubmitting(true)

    try {
      const session = (await supabase.auth.getSession()).data.session
      const res = await fetch('/api/tenants/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          email: form.email,
          unit_id: form.unit_id,
          rent_amount_ugx: rentNum,
          start_date: form.start_date,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? 'Invitation failed')
        return
      }

      toast.success('Invitation sent')
      setDialogOpen(false)
      setForm(EMPTY_FORM)
      await Promise.all([fetchTenants(), fetchUnits()])
    } catch {
      toast.error('Unexpected error')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const activeTenants = tenants.filter((t) => t.is_active)
  const pendingTenants = tenants.filter((t) => !t.is_active)

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTenants.length} active · {pendingTenants.length} pending
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Tenant
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Tenant</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Tenant Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tenant@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {/* Unit */}
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select
                  value={form.unit_id}
                  onValueChange={(val) => setForm({ ...form, unit_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vacant unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        No vacant units
                      </SelectItem>
                    ) : (
                      units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.property_name} — Unit {u.unit_number}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Rent */}
              <div className="space-y-1.5">
                <Label htmlFor="rent">Rent Amount (UGX)</Label>
                <Input
                  id="rent"
                  type="number"
                  min={0}
                  placeholder="e.g. 800000"
                  value={form.rent_amount_ugx}
                  onChange={(e) => setForm({ ...form, rent_amount_ugx: e.target.value })}
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <Label htmlFor="start_date">Tenancy Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleInvite}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading tenants…
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <UserPlus className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tenants yet. Invite your first tenant.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Unit
                </span>
              </TableHead>
              <TableHead>
                <span className="flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5" /> Rent / mo
                </span>
              </TableHead>
              <TableHead>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Start Date
                </span>
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {tenants.map((t) => (
              <TableRow key={t.tenancy_id}>
                <TableCell>
                  <div className="font-medium">
                    {t.tenant_name ?? t.tenant_email}
                  </div>
                  {t.tenant_name && (
                    <div className="text-xs text-muted-foreground">{t.tenant_email}</div>
                  )}
                </TableCell>

                <TableCell>
                  <div>{t.property_name}</div>
                  <div className="text-xs text-muted-foreground">Unit {t.unit_number}</div>
                </TableCell>

                <TableCell className="font-mono text-sm">
                  {formatUGX(t.rent_amount_ugx)}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(t.start_date)}
                </TableCell>

                <TableCell>
                  {t.is_active ? (
                    <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-amber-600 bg-amber-50 hover:bg-amber-50">
                      Pending
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
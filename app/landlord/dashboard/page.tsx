'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/stat-card'
import { RecentPaymentsCard } from '@/components/dashboard/recent-payments-card'
import { PendingMaintenanceCard } from '@/components/dashboard/pending-maintenance-card'
import { IncomeChartCard } from '@/components/dashboard/income-chart-card'
import { dashboardIcons } from '@/components/dashboard/icons'
import { ArrowRight, Calendar } from 'lucide-react'

function formatUGX(amount: number) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function LandlordDashboard() {
  const supabase = createClient()

  const [stats, setStats] = useState({
    totalProperties: 0,
    activeTenants: 0,
    monthlyIncome: 0,
    pendingMaintenance: 0,
    occupiedUnits: 0,
    totalUnits: 0,
  })
  const [payments, setPayments] = useState<any[]>([])
  const [maintenance, setMaintenance] = useState<any[]>([])
  const [incomeData, setIncomeData] = useState<{ month: string; income: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const landlordId = user.id

      // Properties
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('landlord_id', landlordId)

      const propertyIds = properties?.map(p => p.id) ?? []

      // Units
      const { data: units } = await supabase
        .from('units')
        .select('id, status')
        .in('property_id', propertyIds.length ? propertyIds : ['none'])

      const totalUnits    = units?.length ?? 0
      const occupiedUnits = units?.filter(u => u.status === 'occupied').length ?? 0

      // Active tenancies — correct column: monthly_rent (not monthly_rent_ugx)
      const { data: tenancies } = await supabase
        .from('tenancies')
        .select('id, tenant_id, monthly_rent')
        .eq('landlord_id', landlordId)
        .eq('status', 'active')

      const activeTenants = tenancies?.length ?? 0

      // Pending maintenance — correct table: maintenance_requests (not maintenace_requests)
      const { data: pendingReqs } = await supabase
        .from('maintenance_requests')
        .select('id')
        .eq('landlord_id', landlordId)
        .eq('status', 'open')

      const pendingMaintenance = pendingReqs?.length ?? 0

      // Recent payments — now sourced from payments + invoices
      // (rent_payments was never migrated; invoices/property_units/
      // payments is the schema the Pesapal/guest-pay flow uses).
      const { data: recentPayments } = await supabase
        .from('payments')
        .select(
          `
          id, amount, status, paid_at, created_at, is_guest_payment, guest_name,
          invoices!inner (
            tenant_id,
            tenants:profiles!invoices_tenant_id_fkey ( full_name ),
            property_units!inner (
              properties!inner ( title, landlord_id )
            )
          )
        `
        )
        .eq('invoices.property_units.properties.landlord_id', landlordId)
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(5)

      // Monthly income (current month)
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const { data: monthPayments } = await supabase
        .from('payments')
        .select('amount, invoices!inner(property_units!inner(properties!inner(landlord_id)))')
        .eq('invoices.property_units.properties.landlord_id', landlordId)
        .eq('status', 'paid')
        .gte('paid_at', monthStart)

      const monthlyIncome = monthPayments?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0

      // Income last 6 months
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
        return {
          label: d.toLocaleString('en-UG', { month: 'short' }),
          start: d.toISOString(),
          end:   new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString(),
        }
      })

      const incomeByMonth = await Promise.all(
        months.map(async ({ label, start, end }) => {
          const { data } = await supabase
            .from('payments')
            .select('amount, invoices!inner(property_units!inner(properties!inner(landlord_id)))')
            .eq('invoices.property_units.properties.landlord_id', landlordId)
            .eq('status', 'paid')
            .gte('paid_at', start)
            .lt('paid_at', end)
          const income = data?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0
          return { month: label, income }
        })
      )

      // Maintenance requests for display
      const { data: maintRequests } = await supabase
        .from('maintenance_requests')
        .select('id, title, status, created_at, tenant_id, landlord_id')
        .eq('landlord_id', landlordId)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        totalProperties: propertyIds.length,
        activeTenants,
        monthlyIncome,
        pendingMaintenance,
        occupiedUnits,
        totalUnits,
      })
      setPayments(
        (recentPayments ?? []).map((p: any) => ({
          id:       p.id,
          tenant:   p.is_guest_payment ? (p.guest_name ?? 'Guest') : (p.invoices?.tenants?.full_name ?? '—'),
          property: p.invoices?.property_units?.properties?.title ?? '—',
          amount:   p.amount,
          date:     p.paid_at ?? p.created_at,
          status:   'paid',
        }))
      )
      setMaintenance(
        (maintRequests ?? []).map(r => ({
          id:            r.id,
          property:      '—',
          tenant:        r.tenant_id,
          issue:         r.title,
          status:        r.status === 'open' ? 'pending' : 'in_progress',
          submittedDate: r.created_at,
        }))
      )
      setIncomeData(incomeByMonth)
      setLoading(false)
    }

    load()
  }, [])

  const PropertyIcon   = dashboardIcons.property
  const TenantsIcon    = dashboardIcons.tenants
  const IncomeIcon     = dashboardIcons.income
  const MaintenanceIcon = dashboardIcons.maintenance

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading dashboard…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 md:px-6 lg:px-8">
        <div className="mb-8 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Welcome back! Here's your property overview for <span className="font-medium">Uganda</span>
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-UG', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <StatCard label="Total Properties"  value={stats.totalProperties}        subtext="Active properties"        icon={<PropertyIcon    className="w-5 h-5" />} />
          <StatCard label="Active Tenants"    value={stats.activeTenants}          subtext="Across all properties"   icon={<TenantsIcon     className="w-5 h-5" />} />
          <StatCard label="Monthly Income"    value={formatUGX(stats.monthlyIncome)} subtext="UGX collected this month" icon={<IncomeIcon    className="w-5 h-5" />} />
          <StatCard label="Pending Issues"    value={stats.pendingMaintenance}     subtext="Maintenance requests"    icon={<MaintenanceIcon className="w-5 h-5" />} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">
          <div className="md:col-span-2">
            <IncomeChartCard data={incomeData} currency="UGX" />
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Occupancy Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Occupied Units</span>
                      <span className="text-2xl font-bold text-primary">
                        {stats.totalUnits > 0
                          ? `${Math.round((stats.occupiedUnits / stats.totalUnits) * 100)}%`
                          : '—'}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: stats.totalUnits > 0
                            ? `${(stats.occupiedUnits / stats.totalUnits) * 100}%`
                            : '0%'
                        }}
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      {stats.occupiedUnits} of {stats.totalUnits} units occupied
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RecentPaymentsCard payments={payments} currency="UGX" />
          <PendingMaintenanceCard requests={maintenance} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/landlord/properties">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PropertyIcon className="w-5 h-5 text-primary" /> Manage Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Add, edit, or manage your property listings</p>
                <div className="flex items-center text-primary text-sm font-medium">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/landlord/tenants">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TenantsIcon className="w-5 h-5 text-primary" /> Manage Tenants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">View tenant details and communications</p>
                <div className="flex items-center text-primary text-sm font-medium">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/landlord/payments">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <IncomeIcon className="w-5 h-5 text-primary" /> Payment Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Monitor all incoming rent payments</p>
                <div className="flex items-center text-primary text-sm font-medium">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

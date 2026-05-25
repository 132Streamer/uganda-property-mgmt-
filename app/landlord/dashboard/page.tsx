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

      // Active tenancies
      const { data: tenancies } = await supabase
        .from('tenancies')
        .select('id, tenant_id, monthly_rent_ugx')
        .eq('landlord_id', landlordId)
        .eq('status', 'active')

      // Units
      const { data: units } = await supabase
        .from('units')
        .select('id, status')
        .in('property_id', propertyIds.length ? propertyIds : ['none'])

      // Pending maintenance
      const { data: pendingM } = await supabase
        .from('maintenace_requests')
        .select('id')
        .eq('landlord_id', landlordId)
        .eq('status', 'open')

      // Recent payments
      const { data: recentPayments } = await supabase
        .from('rent_payments')
        .select('id, amount_ugx, paid_at, created_at, status, tenant_id, tenancy_id')
        .eq('landlord_id', landlordId)
        .eq('status', 'completed')
        .order('paid_at', { ascending: false })
        .limit(5)

      // Maintenance requests for display
      const { data: maintenanceList } = await supabase
        .from('maintenace_requests')
        .select('id, title, status, created_at, tenant_id, property_id')
        .eq('landlord_id', landlordId)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(5)

      // Income last 6 months
      const now = new Date()
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      const { data: incomeRows } = await supabase
        .from('rent_payments')
        .select('amount_ugx, paid_at')
        .eq('landlord_id', landlordId)
        .eq('status', 'completed')
        .gte('paid_at', sixMonthsAgo.toISOString())

      // Build income chart data
      const monthMap: Record<string, number> = {}
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = d.toLocaleString('en-UG', { month: 'short' })
        monthMap[key] = 0
      }
      incomeRows?.forEach(row => {
        const key = new Date(row.paid_at).toLocaleString('en-UG', { month: 'short' })
        if (key in monthMap) monthMap[key] += row.amount_ugx
      })
      const chartData = Object.entries(monthMap).map(([month, income]) => ({ month, income }))

      const occupiedUnits = units?.filter(u => u.status === 'occupied').length ?? 0
      const monthlyIncome = tenancies?.reduce((sum, t) => sum + (t.monthly_rent_ugx ?? 0), 0) ?? 0

      setStats({
        totalProperties: properties?.length ?? 0,
        activeTenants: tenancies?.length ?? 0,
        monthlyIncome,
        pendingMaintenance: pendingM?.length ?? 0,
        occupiedUnits,
        totalUnits: units?.length ?? 0,
      })
      setPayments(recentPayments ?? [])
      setMaintenance(maintenanceList ?? [])
      setIncomeData(chartData)
      setLoading(false)
    }

    load()
  }, [])

  const PropertyIcon = dashboardIcons.property
  const TenantsIcon = dashboardIcons.tenants
  const IncomeIcon = dashboardIcons.income
  const MaintenanceIcon = dashboardIcons.maintenance

  const occupancyPct = stats.totalUnits > 0
    ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100)
    : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-8 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back! Here&apos;s your property overview for <span className="font-medium">Uganda</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Properties" value={stats.totalProperties} subtext="Active properties" icon={<PropertyIcon className="w-5 h-5" />} trend="up" trendValue="" />
            <StatCard label="Active Tenants" value={stats.activeTenants} subtext="Across all properties" icon={<TenantsIcon className="w-5 h-5" />} trend="up" trendValue="" />
            <StatCard label="Monthly Income" value={`${(stats.monthlyIncome / 1000000).toFixed(1)}M`} subtext="UGX expected" icon={<IncomeIcon className="w-5 h-5" />} trend="up" trendValue="" />
            <StatCard label="Pending Issues" value={stats.pendingMaintenance} subtext="Maintenance requests" icon={<MaintenanceIcon className="w-5 h-5" />} trend={stats.pendingMaintenance > 2 ? 'down' : 'up'} trendValue={stats.pendingMaintenance > 2 ? 'Attention needed' : 'On track'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
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
                        <span className="text-2xl font-bold text-primary">{occupancyPct}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${occupancyPct}%` }} />
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
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: '/landlord/properties', icon: PropertyIcon, title: 'Manage Properties', desc: 'Add, edit, or manage your property listings' },
          { href: '/landlord/tenants', icon: TenantsIcon, title: 'Manage Tenants', desc: 'View tenant details and communications' },
          { href: '/landlord/payments', icon: IncomeIcon, title: 'Payment Tracking', desc: 'Monitor all incoming rent payments' },
        ].map(({ href, icon: Icon, title, desc }) => (
          <Link href={href} key={href}>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{desc}</p>
                <div className="flex items-center text-primary text-sm font-medium">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
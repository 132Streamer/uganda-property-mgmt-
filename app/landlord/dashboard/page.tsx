'use client'
export const dynamic = 'force-dynamic';
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/stat-card'
import { RecentPaymentsCard } from '@/components/dashboard/recent-payments-card'
import { PendingMaintenanceCard } from '@/components/dashboard/pending-maintenance-card'
import { IncomeChartCard } from '@/components/dashboard/income-chart-card'
import { dashboardIcons } from '@/components/dashboard/icons'
import { ArrowRight, Calendar } from 'lucide-react'

// Mock data - Replace with real data from Supabase
const mockPayments = [
  {
    id: '1',
    tenant: 'Alice Nakigudde',
    property: 'Tower Road, Kampala',
    amount: 1500000,
    date: '2024-05-20',
    status: 'paid' as const,
  },
  {
    id: '2',
    tenant: 'Ibrahim Hassan',
    property: 'Kololo Hill, Kampala',
    amount: 2000000,
    date: '2024-05-19',
    status: 'paid' as const,
  },
  {
    id: '3',
    tenant: 'Sarah Mulanga',
    property: 'Naguru, Kampala',
    amount: 1200000,
    date: '2024-05-18',
    status: 'pending' as const,
  },
  {
    id: '4',
    tenant: 'David Muwonge',
    property: 'Bukoto, Kampala',
    amount: 1800000,
    date: '2024-05-17',
    status: 'paid' as const,
  },
]

const mockMaintenanceRequests = [
  {
    id: '1',
    property: 'Tower Road, Kampala',
    tenant: 'Alice Nakigudde',
    issue: 'Leaking bathroom faucet needs replacement',
    status: 'pending' as const,
    submittedDate: '2024-05-18',
  },
  {
    id: '2',
    property: 'Kololo Hill, Kampala',
    tenant: 'Ibrahim Hassan',
    issue: 'Air conditioner not working properly',
    status: 'in_progress' as const,
    submittedDate: '2024-05-17',
  },
  {
    id: '3',
    property: 'Naguru, Kampala',
    tenant: 'Sarah Mulanga',
    issue: 'Paint peeling from bedroom wall',
    status: 'pending' as const,
    submittedDate: '2024-05-16',
  },
]

const mockIncomeData = [
  { month: 'Nov', income: 16500000 },
  { month: 'Dec', income: 17200000 },
  { month: 'Jan', income: 18100000 },
  { month: 'Feb', income: 17800000 },
  { month: 'Mar', income: 18500000 },
  { month: 'Apr', income: 18200000 },
]

export default function LandlordDashboard() {
  const [selectedPeriod] = useState('thisMonth')

  const totalProperties = 12
  const activeTenants = 28
  const monthlyIncome = 18500000
  const pendingMaintenance = mockMaintenanceRequests.filter(r => r.status === 'pending').length

  const PropertyIcon = dashboardIcons.property
  const TenantsIcon = dashboardIcons.tenants
  const IncomeIcon = dashboardIcons.income
  const MaintenanceIcon = dashboardIcons.maintenance

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back! Here&apos;s your property overview for{' '}
              <span className="font-medium">Uganda</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-UG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Properties"
          value={totalProperties}
          subtext="Active properties"
          icon={<PropertyIcon className="w-5 h-5" />}
          trend="up"
          trendValue="+2 this month"
        />
        <StatCard
          label="Active Tenants"
          value={activeTenants}
          subtext="Across all properties"
          icon={<TenantsIcon className="w-5 h-5" />}
          trend="up"
          trendValue="+3 this month"
        />
        <StatCard
          label="Monthly Income"
          value={`${(monthlyIncome / 1000000).toFixed(1)}M`}
          subtext="UGX collected"
          icon={<IncomeIcon className="w-5 h-5" />}
          trend="up"
          trendValue="+1.8% vs last month"
        />
        <StatCard
          label="Pending Issues"
          value={pendingMaintenance}
          subtext="Maintenance requests"
          icon={<MaintenanceIcon className="w-5 h-5" />}
          trend={pendingMaintenance > 2 ? 'down' : 'up'}
          trendValue={pendingMaintenance > 2 ? 'Attention needed' : 'On track'}
        />
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <IncomeChartCard data={mockIncomeData} currency="UGX" />
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
                    <span className="text-2xl font-bold text-primary">88%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: '88%' }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {totalProperties - Math.ceil(totalProperties * 0.12)} of {totalProperties} units occupied
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <RecentPaymentsCard payments={mockPayments} currency="UGX" />
        <PendingMaintenanceCard requests={mockMaintenanceRequests} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/landlord/properties">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PropertyIcon className="w-5 h-5 text-primary" />
                Manage Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Add, edit, or manage your property listings
              </p>
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
                <TenantsIcon className="w-5 h-5 text-primary" />
                Manage Tenants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View tenant details and communications
              </p>
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
                <IncomeIcon className="w-5 h-5 text-primary" />
                Payment Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monitor all incoming rent payments
              </p>
              <div className="flex items-center text-primary text-sm font-medium">
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

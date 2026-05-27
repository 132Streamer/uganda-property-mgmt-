import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import UploadLeasePdfButton from '@/components/UploadLeasePdfButton'

interface PageProps {
  params: { id: string }
}

// Derive tenancy status + days until end_date
function computeDaysUntilExpiry(endDate: string | null): number {
  if (!endDate) return 9999
  return Math.floor((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function resolveStatus(status: string, endDate: string | null) {
  if (status === 'ended') return 'ended'
  if (status === 'pending') return 'pending'
  const days = computeDaysUntilExpiry(endDate)
  if (days < 0) return 'expired'
  return 'active'
}

function LeaseRowHighlight(status: string, days: number) {
  if (status === 'ended') return 'bg-gray-50 opacity-60'
  if (status === 'expired' || days < 0) return 'bg-red-50'
  if (days <= 30) return 'bg-yellow-50'
  return ''
}

function StatusBadge({ status, days }: { status: string; days: number }) {
  const resolved =
    status === 'ended' ? 'ended' :
    days < 0 ? 'expired' :
    days <= 30 ? 'expiring soon' :
    status

  const colors: Record<string, string> = {
    active:          'bg-green-100 text-green-800',
    'expiring soon': 'bg-yellow-100 text-yellow-800',
    expired:         'bg-red-100 text-red-800',
    ended:           'bg-gray-100 text-gray-600',
    pending:         'bg-blue-100 text-blue-800',
  }

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${colors[resolved] ?? 'bg-gray-100 text-gray-600'}`}>
      {resolved}
    </span>
  )
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency', currency: 'UGX', maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

async function createSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: any; value: any; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

export default async function PropertyPage({ params }: PageProps) {
  const { id: propertyId } = params
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'landlord') redirect('/')

  // Fetch property — verify ownership
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, title, address, landlord_id')
    .eq('id', propertyId)
    .eq('landlord_id', user.id)
    .single()

  if (propError || !property) notFound()

  // Fetch tenancies via units → tenancies → tenant profile + lease docs
  const { data: units, error: unitsError } = await supabase
    .from('units')
    .select(`
      id, unit_number,
      tenancies (
        id, tenant_id, start_date, end_date, monthly_rent, status,
        tenant:profiles!tenancies_tenant_id_fkey ( full_name, phone ),
        lease_documents ( id, file_url, file_name, uploaded_at )
      )
    `)
    .eq('property_id', propertyId)

  if (unitsError) {
    console.error('Units fetch error:', unitsError)
    throw new Error('Failed to load tenancies.')
  }

  // Flatten units → tenancies into a display list
  type TenancyRow = {
    id: string
    unit_number: string
    unit_id: string
    tenant_id: string
    tenant_name: string
    tenant_phone: string | null
    start_date: string
    end_date: string | null
    monthly_rent: number
    status: string
    days_until_expiry: number
    lease_doc_url: string | null
    lease_doc_id: string | null
  }

  const rows: TenancyRow[] = []

  for (const unit of units ?? []) {
    for (const t of (unit.tenancies as any[]) ?? []) {
      const days   = computeDaysUntilExpiry(t.end_date)
      const status = resolveStatus(t.status, t.end_date)
      const latestDoc = (t.lease_documents as any[])?.sort(
        (a: any, b: any) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      )[0] ?? null

      rows.push({
        id:               t.id,
        unit_number:      unit.unit_number,
        unit_id:          unit.id,
        tenant_id:        t.tenant_id,
        tenant_name:      t.tenant?.full_name ?? 'Unknown',
        tenant_phone:     t.tenant?.phone ?? null,
        start_date:       t.start_date,
        end_date:         t.end_date,
        monthly_rent:     t.monthly_rent,
        status,
        days_until_expiry: days,
        lease_doc_url:    latestDoc?.file_url ?? null,
        lease_doc_id:     latestDoc?.id ?? null,
      })
    }
  }

  rows.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

  const activeCount   = rows.filter(r => r.status === 'active').length
  const expiringCount = rows.filter(r => r.status === 'active' && r.days_until_expiry <= 30 && r.days_until_expiry >= 0).length
  const expiredCount  = rows.filter(r => r.status === 'expired').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{property.address}</p>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: 'Active Tenancies',  value: activeCount,   color: 'text-green-700' },
            { label: 'Expiring ≤ 30 days', value: expiringCount, color: 'text-yellow-700' },
            { label: 'Expired',            value: expiredCount,  color: 'text-red-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-yellow-100 ring-1 ring-yellow-300" />
            Expiring within 30 days
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-red-100 ring-1 ring-red-300" />
            Expired
          </span>
        </div>

        {/* Tenancy table */}
        {rows.length === 0 ? (
          <div className="rounded-lg bg-white py-16 text-center shadow-sm ring-1 ring-gray-200">
            <p className="text-gray-400">No tenancies found for this property.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Tenant', 'Unit', 'Rent / mo', 'Start', 'End', 'Days Left', 'Status', 'Lease PDF'].map(h => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map(row => (
                    <tr key={row.id} className={`transition-colors ${LeaseRowHighlight(row.status, row.days_until_expiry)}`}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{row.tenant_name}</div>
                        {row.tenant_phone && (
                          <div className="text-xs text-gray-400">{row.tenant_phone}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {row.unit_number}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatCurrency(row.monthly_rent)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatDate(row.start_date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatDate(row.end_date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {row.status === 'ended' ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <span className={
                            row.days_until_expiry < 0    ? 'font-medium text-red-600' :
                            row.days_until_expiry <= 30  ? 'font-medium text-yellow-700' :
                            'text-gray-700'
                          }>
                            {row.days_until_expiry < 0
                              ? `${Math.abs(row.days_until_expiry)}d ago`
                              : `${row.days_until_expiry}d`}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge status={row.status} days={row.days_until_expiry} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <UploadLeasePdfButton
                          leaseId={row.id}
                          hasPdf={!!row.lease_doc_url}
                          pdfUrl={row.lease_doc_url}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
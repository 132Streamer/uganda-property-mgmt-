'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type MaintenanceStatus = 'submitted' | 'acknowledged' | 'in_progress' | 'resolved'

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  status: MaintenanceStatus
  landlord_note: string | null
  created_at: string
  updated_at: string
  properties: {
    name: string
  }
}

const STATUS_CONFIG: Record<
  MaintenanceStatus,
  { label: string; className: string }
> = {
  submitted:    { label: 'Submitted',    className: 'bg-gray-100 text-gray-700 ring-gray-200' },
  acknowledged: { label: 'Acknowledged', className: 'bg-blue-100 text-blue-700 ring-blue-200' },
  in_progress:  { label: 'In Progress',  className: 'bg-amber-100 text-amber-700 ring-amber-200' },
  resolved:     { label: 'Resolved',     className: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
}

function StatusBadge({ status }: { status: MaintenanceStatus }) {
  const { label, className } = STATUS_CONFIG[status] ?? STATUS_CONFIG.submitted
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>
      {label}
    </span>
  )
}

function RequestCard({ request }: { request: MaintenanceRequest }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-gray-900">{request.title}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{request.properties?.name}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <p className="mt-3 text-sm text-gray-600 line-clamp-2">{request.description}</p>

      {request.landlord_note && (
        <div className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <span className="font-medium text-gray-700">Landlord note: </span>
          {request.landlord_note}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <span>Submitted {new Date(request.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        {request.updated_at !== request.created_at && (
          <span>Updated {new Date(request.updated_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        )}
      </div>
    </div>
  )
}

export default function TenantMaintenancePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    async function fetchRequests() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated'); setLoading(false); return }

      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*, properties(name)')
        .eq('tenant_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      else setRequests(data ?? [])
      setLoading(false)
    }

    fetchRequests()
  }, [supabase])

  const grouped = requests.reduce<Partial<Record<MaintenanceStatus, MaintenanceRequest[]>>>(
    (acc, r) => { (acc[r.status] ??= []).push(r); return acc },
    {}
  )

  const statusOrder: MaintenanceStatus[] = ['in_progress', 'acknowledged', 'submitted', 'resolved']

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>

      {loading && (
        <div className="mt-8 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )}

      {error && (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && requests.length === 0 && (
        <p className="mt-8 text-sm text-gray-500">No maintenance requests yet.</p>
      )}

      {!loading && !error && statusOrder.map(status => {
        const group = grouped[status]
        if (!group?.length) return null
        return (
          <section key={status} className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <StatusBadge status={status} />
              <span className="text-xs text-gray-400">{group.length} request{group.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3">
              {group.map(r => <RequestCard key={r.id} request={r} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}
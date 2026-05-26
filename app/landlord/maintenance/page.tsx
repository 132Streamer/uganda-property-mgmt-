'use client'

import { useEffect, useState, useTransition } from 'react'
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
  properties: { name: string }
  profiles: { full_name: string; email: string }
}

const STATUS_OPTIONS: { value: MaintenanceStatus; label: string }[] = [
  { value: 'submitted',    label: 'Submitted'    },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'in_progress',  label: 'In Progress'  },
  { value: 'resolved',     label: 'Resolved'     },
]

const STATUS_COLORS: Record<MaintenanceStatus, string> = {
  submitted:    'text-gray-700  bg-gray-50  border-gray-200',
  acknowledged: 'text-blue-700  bg-blue-50  border-blue-200',
  in_progress:  'text-amber-700 bg-amber-50 border-amber-200',
  resolved:     'text-emerald-700 bg-emerald-50 border-emerald-200',
}

function StatusDropdown({
  requestId,
  current,
  onUpdate,
}: {
  requestId: string
  current: MaintenanceStatus
  onUpdate: (id: string, status: MaintenanceStatus, note: string) => Promise<void>
}) {
  const [status, setStatus]   = useState<MaintenanceStatus>(current)
  const [note, setNote]       = useState('')
  const [open, setOpen]       = useState(false)
  const [pending, startTransition] = useTransition()
  const [toast, setToast]     = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleUpdate() {
    startTransition(async () => {
      try {
        await onUpdate(requestId, status, note)
        setOpen(false)
        setNote('')
        showToast('Status updated')
      } catch {
        showToast('Failed to update')
      }
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${STATUS_COLORS[status]}`}
      >
        {STATUS_OPTIONS.find(o => o.value === status)?.label}
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {toast && (
        <div className="absolute -top-8 left-0 z-50 rounded bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap">
          {toast}
        </div>
      )}

      {open && (
        <div className="absolute left-0 z-40 mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="p-2">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs transition-colors hover:bg-gray-50 ${status === opt.value ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
              >
                {status === opt.value && (
                  <svg className="h-3 w-3 shrink-0 text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={status !== opt.value ? 'ml-5' : ''}>{opt.label}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 p-2">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Note to tenant (optional)"
              rows={2}
              className="w-full resize-none rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
            />
            <div className="mt-1.5 flex gap-1.5">
              <button
                onClick={handleUpdate}
                disabled={pending || status === current}
                className="flex-1 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-opacity disabled:opacity-40"
              >
                {pending ? 'Saving…' : 'Update'}
              </button>
              <button
                onClick={() => { setOpen(false); setStatus(current); setNote('') }}
                className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RequestRow({
  request,
  onUpdate,
}: {
  request: MaintenanceRequest
  onUpdate: (id: string, status: MaintenanceStatus, note: string) => Promise<void>
}) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 pr-4">
        <p className="text-sm font-medium text-gray-900">{request.title}</p>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{request.description}</p>
        {request.landlord_note && (
          <p className="mt-1 text-xs text-gray-400 italic line-clamp-1">Note: {request.landlord_note}</p>
        )}
      </td>
      <td className="py-3 pr-4 text-xs text-gray-600 whitespace-nowrap">
        <p className="font-medium">{request.profiles?.full_name}</p>
        <p className="text-gray-400">{request.profiles?.email}</p>
      </td>
      <td className="py-3 pr-4 text-xs text-gray-500 whitespace-nowrap">
        {request.properties?.name}
      </td>
      <td className="py-3 pr-4 text-xs text-gray-400 whitespace-nowrap">
        {new Date(request.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>
      <td className="py-3">
        <StatusDropdown
          requestId={request.id}
          current={request.status}
          onUpdate={onUpdate}
        />
      </td>
    </tr>
  )
}

export default function LandlordMaintenancePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [filter, setFilter]     = useState<MaintenanceStatus | 'all'>('all')

  useEffect(() => {
    async function fetchRequests() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated'); setLoading(false); return }

      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*, properties(name), profiles:tenant_id(full_name, email)')
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      else setRequests(data ?? [])
      setLoading(false)
    }

    fetchRequests()
  }, [supabase])

  async function handleUpdate(id: string, status: MaintenanceStatus, note: string) {
    const res = await fetch('/api/maintenance/update-status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id, status, landlordNote: note || undefined }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? 'Failed to update')
    }

    const { data } = await res.json()
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const counts = requests.reduce<Partial<Record<MaintenanceStatus | 'all', number>>>(
    (acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc },
    { all: requests.length }
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
        <span className="text-sm text-gray-500">{requests.length} total</span>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {(['all', ...STATUS_OPTIONS.map(o => o.value)] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              filter === s
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_OPTIONS.find(o => o.value === s)?.label}
            {counts[s] ? <span className="ml-1 text-gray-400">({counts[s]})</span> : null}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2 pt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="mt-8 text-sm text-gray-500">No requests found.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {['Request', 'Tenant', 'Property', 'Date', 'Status'].map(h => (
                  <th key={h} className="pb-2 pr-4 text-left text-xs font-medium text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <RequestRow key={r.id} request={r} onUpdate={handleUpdate} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
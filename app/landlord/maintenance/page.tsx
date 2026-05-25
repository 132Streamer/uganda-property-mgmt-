'use client'

export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, ChevronDown, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

type Priority = 'Low' | 'Medium' | 'High' | 'Urgent'
type Status = 'Open' | 'In Progress' | 'Resolved'

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  photo_url: string | null
  created_at: string
  updated_at: string
  tenant: {
    id: string
    full_name: string
    email: string
  }
  property: {
    id: string
    name: string
    address: string
  }
}

interface Property {
  id: string
  name: string
  address: string
}

const PRIORITY_CONFIG: Record<Priority, { className: string }> = {
  Low: { className: 'bg-slate-100 text-slate-700 border-slate-200' },
  Medium: { className: 'bg-blue-50 text-blue-700 border-blue-200' },
  High: { className: 'bg-orange-50 text-orange-700 border-orange-200' },
  Urgent: { className: 'bg-red-50 text-red-700 border-red-200' },
}

const STATUS_CONFIG: Record<Status, { className: string }> = {
  Open: { className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  'In Progress': { className: 'bg-blue-50 text-blue-700 border-blue-200' },
  Resolved: { className: 'bg-green-50 text-green-700 border-green-200' },
}

const ALL = 'all'

export default function LandlordMaintenancePage() {
  const supabase = createClientComponentClient()

  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Filters
  const [filterProperty, setFilterProperty] = useState(ALL)
  const [filterStatus, setFilterStatus] = useState(ALL)
  const [filterPriority, setFilterPriority] = useState(ALL)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchProperties()
    fetchRequests()
  }, [])

  async function fetchProperties() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('properties')
      .select('id, name, address')
      .eq('landlord_id', session.user.id)
    setProperties(data ?? [])
  }

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterProperty !== ALL) params.set('property_id', filterProperty)
      if (filterStatus !== ALL) params.set('status', filterStatus)
      if (filterPriority !== ALL) params.set('priority', filterPriority)

      const res = await fetch(`/api/maintenance?${params.toString()}`)
      const json = await res.json()
      if (json.data) setRequests(json.data)
    } finally {
      setLoading(false)
    }
  }, [filterProperty, filterStatus, filterPriority])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  async function handleStatusUpdate(requestId: string, newStatus: Status) {
    setUpdatingId(requestId)
    try {
      const res = await fetch('/api/maintenance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status: newStatus }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Update failed')

      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
      )
      toast({ title: 'Status updated', description: `Marked as ${newStatus}. Tenant notified.` })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = requests.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      r.tenant.full_name.toLowerCase().includes(q) ||
      r.property.name.toLowerCase().includes(q)
    )
  })

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Maintenance Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} request{filtered.length !== 1 ? 's' : ''}
            {filterProperty !== ALL || filterStatus !== ALL || filterPriority !== ALL
              ? ' (filtered)'
              : ''}
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />

        <Input
          placeholder="Search tenant, property, title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-56 text-sm"
        />

        <Select value={filterProperty} onValueChange={setFilterProperty}>
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue placeholder="All properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All properties</SelectItem>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {(['Open', 'In Progress', 'Resolved'] as Status[]).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All priorities</SelectItem>
            {(['Low', 'Medium', 'High', 'Urgent'] as Priority[]).map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(filterProperty !== ALL || filterStatus !== ALL || filterPriority !== ALL || search) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              setFilterProperty(ALL)
              setFilterStatus(ALL)
              setFilterPriority(ALL)
              setSearch('')
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <Separator />

      {/* ── Table ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-16">No requests found.</p>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-8" />
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => (
                <>
                  <TableRow
                    key={req.id}
                    className={cn(
                      'cursor-pointer hover:bg-muted/40 transition-colors',
                      expandedId === req.id && 'bg-muted/40'
                    )}
                    onClick={() => toggleExpand(req.id)}
                  >
                    <TableCell>
                      {expandedId === req.id ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{req.tenant.full_name}</div>
                      <div className="text-xs text-muted-foreground">{req.tenant.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{req.property.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {req.property.address}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="text-sm truncate block">{req.title}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', PRIORITY_CONFIG[req.priority].className)}
                      >
                        {req.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', STATUS_CONFIG[req.status].className)}
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>

                  {/* ── Expanded Row ── */}
                  {expandedId === req.id && (
                    <TableRow key={`${req.id}-expanded`} className="bg-muted/20 hover:bg-muted/20">
                      <TableCell />
                      <TableCell colSpan={6} className="py-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Description
                              </p>
                              <p className="text-sm whitespace-pre-wrap">{req.description}</p>
                            </div>

                            <div className="space-y-4">
                              {req.photo_url && (
                                <div className="space-y-1.5">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Photo
                                  </p>
                                  <a
                                    href={req.photo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={req.photo_url}
                                      alt="Attachment"
                                      className="h-32 rounded-md object-cover border hover:opacity-90 transition-opacity"
                                    />
                                  </a>
                                </div>
                              )}

                              <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Update Status
                                </p>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={req.status}
                                    onValueChange={(v) =>
                                      handleStatusUpdate(req.id, v as Status)
                                    }
                                    disabled={updatingId === req.id}
                                  >
                                    <SelectTrigger className="w-40 h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(['Open', 'In Progress', 'Resolved'] as Status[]).map(
                                        (s) => (
                                          <SelectItem key={s} value={s}>
                                            {s}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                  {updatingId === req.id && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            Last updated{' '}
                            {formatDistanceToNow(new Date(req.updated_at), { addSuffix: true })}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, Building2 } from 'lucide-react'

type Priority = 'low' | 'medium' | 'high' | 'emergency'
type Status = 'open' | 'in_progress' | 'resolved'

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  images: string[]
  created_at: string
  updated_at: string
  tenant: {
    id: string
    full_name: string
    email: string
  }
  unit: {
    id: string
    unit_number: string
    property: {
      id: string
      name: string
    }
  }
}

const priorityConfig: Record<Priority, { label: string; variant: 'outline' | 'secondary' | 'destructive' | 'default' }> = {
  low: { label: 'Low', variant: 'outline' },
  medium: { label: 'Medium', variant: 'secondary' },
  high: { label: 'High', variant: 'default' },
  emergency: { label: 'Emergency', variant: 'destructive' },
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  resolved: { label: 'Resolved', className: 'bg-green-100 text-green-800 border-green-200' },
}

const nextStatus: Record<Status, Status | null> = {
  open: 'in_progress',
  in_progress: 'resolved',
  resolved: null,
}

const nextStatusLabel: Record<Status, string | null> = {
  open: 'Mark In Progress',
  in_progress: 'Mark Resolved',
  resolved: null,
}

const ALL = 'all'

export default function LandlordMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>(ALL)
  const [priorityFilter, setPriorityFilter] = useState<string>(ALL)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== ALL) params.set('status', statusFilter)
      if (priorityFilter !== ALL) params.set('priority', priorityFilter)

      const res = await fetch(`/api/maintenance?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setRequests(json.data)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, priorityFilter])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  async function updateStatus(id: string, currentStatus: Status) {
    const next = nextStatus[currentStatus]
    if (!next) return

    setUpdatingId(id)
    try {
      const res = await fetch('/api/maintenance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: next } : r))
      )
      toast.success(`Status updated to ${statusConfig[next].label}`)
    } catch (err: any) {
      toast.error(err.message ?? 'Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const stats = {
    open: requests.filter((r) => r.status === 'open').length,
    in_progress: requests.filter((r) => r.status === 'in_progress').length,
    resolved: requests.filter((r) => r.status === 'resolved').length,
    emergency: requests.filter((r) => r.priority === 'emergency').length,
  }

  return (
    <div className="container mx-auto max-w-7xl py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maintenance Requests</h1>
          <p className="text-sm text-muted-foreground">All properties overview</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: stats.open, className: 'text-yellow-600' },
          { label: 'In Progress', value: stats.in_progress, className: 'text-blue-600' },
          { label: 'Resolved', value: stats.resolved, className: 'text-green-600' },
          { label: 'Emergency', value: stats.emergency, className: 'text-red-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className={`text-3xl font-bold ${stat.className}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" onClick={fetchRequests}>
          Refresh
        </Button>

        <span className="text-sm text-muted-foreground ml-auto">
          {requests.length} request{requests.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Property / Unit</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                    No requests match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="max-w-[200px]">
                      <p className="font-medium truncate">{req.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{req.description}</p>
                    </TableCell>

                    <TableCell>
                      <p className="text-sm font-medium">{req.tenant.full_name}</p>
                      <p className="text-xs text-muted-foreground">{req.tenant.email}</p>
                    </TableCell>

                    <TableCell>
                      <p className="text-sm">{req.unit.property.name}</p>
                      <p className="text-xs text-muted-foreground">Unit {req.unit.unit_number}</p>
                    </TableCell>

                    <TableCell>
                      <Badge variant={priorityConfig[req.priority].variant}>
                        {priorityConfig[req.priority].label}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className={statusConfig[req.status].className}>
                        {statusConfig[req.status].label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </TableCell>

                    <TableCell className="text-right">
                      {nextStatusLabel[req.status] ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === req.id}
                          onClick={() => updateStatus(req.id, req.status)}
                        >
                          {updatingId === req.id && (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          )}
                          {nextStatusLabel[req.status]}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
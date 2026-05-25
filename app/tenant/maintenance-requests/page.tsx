'use client'

export const dynamic = 'force-dynamic';
import { useEffect, useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { Loader2, UploadCloud, X, PlusCircle, ClipboardList } from 'lucide-react'
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

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  Low: { label: 'Low', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  Medium: { label: 'Medium', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  High: { label: 'High', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  Urgent: { label: 'Urgent', className: 'bg-red-50 text-red-700 border-red-200' },
}

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  Open: { label: 'Open', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  'In Progress': { label: 'In Progress', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  Resolved: { label: 'Resolved', className: 'bg-green-50 text-green-700 border-green-200' },
}

export default function TenantMaintenancePage() {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority | ''>('')
  const [propertyId, setPropertyId] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Data state
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch tenant's active lease properties
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: leases } = await supabase
        .from('leases')
        .select('property:properties!property_id (id, name, address)')
        .eq('tenant_id', session.user.id)
        .eq('status', 'active')

      const props = (leases?.map((l: any) => l.property) ?? []) as Property[]
      setProperties(props)

      if (props.length === 1) setPropertyId(props[0].id)

      // Fetch requests
      const res = await fetch('/api/maintenance')
      const json = await res.json()
      if (json.data) setRequests(json.data)
    } finally {
      setLoading(false)
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB.', variant: 'destructive' })
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function clearPhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadPhoto(file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `maintenance/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('uploads').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('uploads').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !description || !priority || !propertyId) {
      toast({ title: 'Fill in all required fields', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      let photo_url: string | null = null
      if (photoFile) {
        photo_url = await uploadPhoto(photoFile)
      }

      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority, property_id: propertyId, photo_url }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? 'Submission failed')
      }

      toast({ title: 'Request submitted', description: 'Your landlord has been notified.' })

      // Reset form
      setTitle('')
      setDescription('')
      setPriority('')
      if (properties.length !== 1) setPropertyId('')
      clearPhoto()

      // Refresh list
      await fetchData()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* ── Submit Form ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Submit Maintenance Request
          </CardTitle>
          <CardDescription>
            Describe the issue and we'll notify your landlord immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Property */}
            {properties.length > 1 && (
              <div className="space-y-1.5">
                <Label htmlFor="property">Property <span className="text-destructive">*</span></Label>
                <Select value={propertyId} onValueChange={setPropertyId}>
                  <SelectTrigger id="property">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {p.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="e.g. Leaking kitchen tap"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail — when it started, how severe it is, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority <span className="text-destructive">*</span></Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {(['Low', 'Medium', 'High', 'Urgent'] as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Photo Upload */}
            <div className="space-y-1.5">
              <Label>Photo (optional)</Label>
              {photoPreview ? (
                <div className="relative w-40 h-40 rounded-md overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center border-2 border-dashed rounded-md h-28 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">Click to upload — max 5MB</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Submitting…' : 'Submit Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* ── Past Requests ── */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ClipboardList className="h-5 w-5 text-primary" />
          My Requests
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-12">No requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id} className="transition-shadow hover:shadow-md">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-medium truncate">{req.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.property.name} · {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={cn('text-xs', PRIORITY_CONFIG[req.priority].className)}
                      >
                        {req.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', STATUS_CONFIG[req.status].className)}
                      >
                        {req.status}
                      </Badge>
                    </div>
                  </div>
                  {req.photo_url && (
                    <a
                      href={req.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={req.photo_url}
                        alt="Attachment"
                        className="h-20 rounded-md object-cover border hover:opacity-90 transition-opacity"
                      />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

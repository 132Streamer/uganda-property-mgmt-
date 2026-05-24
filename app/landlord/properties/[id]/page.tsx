'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MapPin,
  Bed,
  Bath,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Home,
  Wrench,
  CheckCircle2,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tenant {
  id: string
  full_name: string
  email: string
  phone: string
}

interface Tenancy {
  id: string
  start_date: string
  end_date: string
  status: string
  tenant: Tenant
}

interface Unit {
  id: string
  unit_number: string
  floor: number | null
  rent_ugx: number
  status: 'available' | 'occupied' | 'maintenance'
  tenancies: Tenancy[]
}

interface Property {
  id: string
  title: string
  description: string
  district: string
  address: string
  rent_ugx: number
  bedrooms: number
  bathrooms: number
  property_type: string
  status: 'available' | 'occupied' | 'maintenance'
  amenities: string[]
  photos: string[]
  created_at: string
  updated_at: string
  units: Unit[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-emerald-500/15 text-emerald-600 border-emerald-200',
  occupied: 'bg-blue-500/15 text-blue-600 border-blue-200',
  maintenance: 'bg-amber-500/15 text-amber-600 border-amber-200',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  available: <CheckCircle2 className="w-3.5 h-3.5" />,
  occupied: <Home className="w-3.5 h-3.5" />,
  maintenance: <Wrench className="w-3.5 h-3.5" />,
}

function formatUGX(amount: number) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-UG', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─── Photo Gallery ───────────────────────────────────────────────────────────

function PhotoGallery({ photos }: { photos: string[] }) {
  const [active, setActive] = useState(0)

  if (!photos?.length) {
    return (
      <div className="aspect-video rounded-xl bg-muted flex items-center justify-center">
        <Building2 className="w-16 h-16 text-muted-foreground" />
      </div>
    )
  }

  function prev() { setActive(i => (i - 1 + photos.length) % photos.length) }
  function next() { setActive(i => (i + 1) % photos.length) }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
        <Image
          src={photos[active]}
          alt=""
          fill
          className="object-cover"
          priority
        />
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              {active + 1} / {photos.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                i === active ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-80'
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Unit Card ────────────────────────────────────────────────────────────────

function UnitCard({ unit }: { unit: Unit }) {
  const activeTenancy = unit.tenancies?.find(t => t.status === 'active')
  const tenant = activeTenancy?.tenant

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-sm">Unit {unit.unit_number}</span>
          {unit.floor != null && (
            <span className="text-xs text-muted-foreground ml-2">Floor {unit.floor}</span>
          )}
        </div>
        <Badge
          variant="outline"
          className={`text-xs capitalize border flex items-center gap-1 ${STATUS_STYLES[unit.status]}`}
        >
          {STATUS_ICONS[unit.status]}
          {unit.status}
        </Badge>
      </div>

      <div className="text-sm font-medium">{formatUGX(unit.rent_ugx)}<span className="text-muted-foreground font-normal text-xs">/mo</span></div>

      {tenant ? (
        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">{tenant.full_name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="w-3 h-3 shrink-0" />
            <span>{tenant.email}</span>
          </div>
          {tenant.phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="w-3 h-3 shrink-0" />
              <span>{tenant.phone}</span>
            </div>
          )}
          {activeTenancy && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>
                {formatDate(activeTenancy.start_date)} – {activeTenancy.end_date ? formatDate(activeTenancy.end_date) : 'Open'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">No current tenant</p>
      )}
    </div>
  )
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

const UGANDAN_DISTRICTS = [
  'Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Entebbe', 'Mbarara',
  'Gulu', 'Lira', 'Fort Portal', 'Masaka', 'Mbale', 'Arua',
]

function EditDialog({
  property,
  onUpdated,
}: {
  property: Property
  onUpdated: (p: Property) => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: property.title,
    description: property.description ?? '',
    district: property.district,
    address: property.address,
    rent_ugx: String(property.rent_ugx),
    bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms),
    property_type: property.property_type,
    status: property.status,
    amenities: property.amenities?.join(', ') ?? '',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/properties/${property.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rent_ugx: Number(form.rent_ugx),
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Update failed')
      toast.success('Property updated')
      onUpdated({ ...property, ...json.data })
      setOpen(false)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Pencil className="w-4 h-4" /> Edit Property
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>District *</Label>
              <Select value={form.district} onValueChange={v => set('district', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UGANDAN_DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Address *</Label>
              <Input value={form.address} onChange={e => set('address', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Property Type</Label>
              <Select value={form.property_type} onValueChange={v => set('property_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['apartment', 'house', 'studio', 'commercial', 'land'].map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['available', 'occupied', 'maintenance'].map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Rent (UGX) *</Label>
              <Input type="number" value={form.rent_ugx} onChange={e => set('rent_ugx', e.target.value)} min={0} required />
            </div>
            <div className="space-y-1.5">
              <Label>Bedrooms</Label>
              <Input type="number" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} min={0} />
            </div>
            <div className="space-y-1.5">
              <Label>Bathrooms</Label>
              <Input type="number" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} min={0} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Amenities</Label>
            <Input
              placeholder="Parking, Generator, Borehole (comma-separated)"
              value={form.amenities}
              onChange={e => set('amenities', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const id = params.id as string

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/properties/${id}`)
        if (res.status === 401) { router.push('/login'); return }
        if (res.status === 404) { router.push('/properties'); return }
        const json = await res.json()
        setProperty(json.data)
      } catch {
        toast.error('Failed to load property')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  async function handleDelete() {
    if (!property) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Delete failed')
      }
      toast.success('Property deleted')
      router.push('/properties')
    } catch (err) {
      toast.error((err as Error).message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="aspect-video bg-muted rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (!property) return null

  const activeTenantCount = property.units?.filter(u =>
    u.tenancies?.some(t => t.status === 'active')
  ).length ?? 0

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link href="/properties">
            <ArrowLeft className="w-4 h-4" />
            Properties
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{property.title}</h1>
            <Badge
              variant="outline"
              className={`capitalize border flex items-center gap-1 ${STATUS_STYLES[property.status]}`}
            >
              {STATUS_ICONS[property.status]}
              {property.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{property.address}, {property.district}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <EditDialog property={property} onUpdated={setProperty} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this property?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is irreversible. Properties with active tenancies cannot be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Delete Property
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Gallery */}
      <PhotoGallery photos={property.photos} />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Rent</p>
          <p className="text-xl font-bold">{formatUGX(property.rent_ugx)}</p>
        </div>
        <div className="rounded-lg border border-border p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Type</p>
          <p className="text-xl font-bold capitalize">{property.property_type}</p>
        </div>
        <div className="rounded-lg border border-border p-4 space-y-1 flex flex-col">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Bedrooms</p>
          <div className="flex items-center gap-1.5">
            <Bed className="w-4 h-4 text-muted-foreground" />
            <p className="text-xl font-bold">{property.bedrooms}</p>
          </div>
        </div>
        <div className="rounded-lg border border-border p-4 space-y-1 flex flex-col">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Bathrooms</p>
          <div className="flex items-center gap-1.5">
            <Bath className="w-4 h-4 text-muted-foreground" />
            <p className="text-xl font-bold">{property.bathrooms}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {property.description && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Description</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
        </div>
      )}

      {/* Amenities */}
      {property.amenities?.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {property.amenities.map(a => (
              <Badge key={a} variant="secondary" className="text-sm">{a}</Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Units */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Units</h2>
          <span className="text-sm text-muted-foreground">
            {activeTenantCount} occupied · {(property.units?.length ?? 0) - activeTenantCount} available
          </span>
        </div>

        {!property.units?.length ? (
          <p className="text-sm text-muted-foreground italic">No units added yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {property.units.map(unit => <UnitCard key={unit.id} unit={unit} />)}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="text-xs text-muted-foreground pt-2">
        Created {formatDate(property.created_at)}
        {property.updated_at !== property.created_at && ` · Updated ${formatDate(property.updated_at)}`}
      </div>
    </div>
  )
}

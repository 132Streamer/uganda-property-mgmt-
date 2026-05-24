'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Plus,
  Building2,
  MapPin,
  Pencil,
  Eye,
  Upload,
  X,
  Loader2,
} from 'lucide-react'

interface Property {
  id: string
  title: string
  district: string
  address: string
  rent_ugx: number
  status: 'available' | 'occupied' | 'maintenance'
  property_type: string
  photos: string[]
  bedrooms: number
  bathrooms: number
  created_at: string
}

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-emerald-500/15 text-emerald-600 border-emerald-200',
  occupied: 'bg-blue-500/15 text-blue-600 border-blue-200',
  maintenance: 'bg-amber-500/15 text-amber-600 border-amber-200',
}

const UGANDAN_DISTRICTS = [
  'Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Entebbe', 'Mbarara',
  'Gulu', 'Lira', 'Fort Portal', 'Masaka', 'Mbale', 'Arua',
]

interface PhotoUploadState {
  file: File
  preview: string
  uploading: boolean
  url?: string
  error?: string
}

function formatUGX(amount: number) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount)
}

function PhotoUploader({
  photos,
  onChange,
}: {
  photos: PhotoUploadState[]
  onChange: (photos: PhotoUploadState[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File, index: number) {
    const formData = new FormData()
    formData.append('file', file)

    onChange(
      photos.map((p, i) => (i === index ? { ...p, uploading: true, error: undefined } : p))
    )

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? 'Upload failed')

      onChange(
        photos.map((p, i) => (i === index ? { ...p, uploading: false, url: json.url } : p))
      )
    } catch (err) {
      onChange(
        photos.map((p, i) =>
          i === index
            ? { ...p, uploading: false, error: (err as Error).message }
            : p
        )
      )
    }
  }

  function addFiles(files: FileList) {
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed')
      return
    }

    const newPhotos: PhotoUploadState[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
    }))

    const updated = [...photos, ...newPhotos]
    onChange(updated)

    newPhotos.forEach((_, i) => {
      uploadFile(files[i], photos.length + i)
    })
  }

  function remove(index: number) {
    const updated = photos.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-2">
        {photos.map((p, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
            <Image src={p.preview} alt="" fill className="object-cover" />
            {p.uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
            )}
            {p.error && (
              <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                <span className="text-[10px] text-destructive text-center px-1">{p.error}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {photos.length < 5 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground"
          >
            <Upload className="w-4 h-4" />
            <span className="text-[10px]">Add</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={e => e.target.files && addFiles(e.target.files)}
      />
      <p className="text-xs text-muted-foreground">JPEG, PNG, WebP · Max 5MB each · Up to 5 photos</p>
    </div>
  )
}

function NewPropertyDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [photos, setPhotos] = useState<PhotoUploadState[]>([])

  const [form, setForm] = useState({
    title: '',
    description: '',
    district: '',
    address: '',
    rent_ugx: '',
    bedrooms: '1',
    bathrooms: '1',
    property_type: 'apartment',
    status: 'available',
    amenities: '',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const pendingUploads = photos.some(p => p.uploading)
    if (pendingUploads) {
      toast.error('Wait for photos to finish uploading')
      return
    }

    const failedUploads = photos.filter(p => !p.url && !p.uploading)
    if (failedUploads.length > 0) {
      toast.error('Some photos failed to upload. Remove them or retry.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rent_ugx: Number(form.rent_ugx),
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          photos: photos.filter(p => p.url).map(p => p.url!),
          amenities: form.amenities
            .split(',')
            .map(a => a.trim())
            .filter(Boolean),
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create property')

      toast.success('Property created')
      setOpen(false)
      setForm({
        title: '', description: '', district: '', address: '',
        rent_ugx: '', bedrooms: '1', bathrooms: '1',
        property_type: 'apartment', status: 'available', amenities: '',
      })
      setPhotos([])
      onCreated()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Property
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Photos */}
          <div className="space-y-1.5">
            <Label>Photos</Label>
            <PhotoUploader photos={photos} onChange={setPhotos} />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g. 3-Bedroom Apartment in Kololo"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the property..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* District + Address */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>District *</Label>
              <Select value={form.district} onValueChange={v => set('district', v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {UGANDAN_DISTRICTS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                placeholder="Plot 12, Acacia Avenue"
                value={form.address}
                onChange={e => set('address', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Property Type *</Label>
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

          {/* Rent + Beds + Baths */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rent">Monthly Rent (UGX) *</Label>
              <Input
                id="rent"
                type="number"
                placeholder="1500000"
                value={form.rent_ugx}
                onChange={e => set('rent_ugx', e.target.value)}
                min={0}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                min={0}
                value={form.bedrooms}
                onChange={e => set('bedrooms', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                min={0}
                value={form.bathrooms}
                onChange={e => set('bathrooms', e.target.value)}
              />
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-1.5">
            <Label htmlFor="amenities">Amenities</Label>
            <Input
              id="amenities"
              placeholder="Parking, Generator, Borehole, Security (comma-separated)"
              value={form.amenities}
              onChange={e => set('amenities', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Property
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PropertyCard({ property }: { property: Property }) {
  const photo = property.photos?.[0]

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
      {/* Photo */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {photo ? (
          <Image
            src={photo}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Building2 className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge
            variant="outline"
            className={`text-xs capitalize border ${STATUS_STYLES[property.status]}`}
          >
            {property.status}
          </Badge>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-1">{property.title}</h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{property.district}</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-base font-bold text-foreground">
            {formatUGX(property.rent_ugx)}
          </span>
          <span className="text-xs text-muted-foreground">/month</span>
        </div>

        <div className="text-xs text-muted-foreground capitalize">
          {property.property_type} · {property.bedrooms} bed · {property.bathrooms} bath
        </div>

        <div className="flex gap-2 pt-1">
          <Button asChild size="sm" variant="outline" className="flex-1 gap-1.5 h-8">
            <Link href={`/properties/${property.id}`}>
              <Eye className="w-3.5 h-3.5" /> View
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1 gap-1.5 h-8">
            <Link href={`/properties/${property.id}/edit`}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function PropertiesPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  async function fetchProperties() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/properties?${params}`)
      if (res.status === 401) { router.push('/login'); return }
      const json = await res.json()
      setProperties(json.data ?? [])
    } catch {
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProperties() }, [statusFilter])

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Properties</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'}
          </p>
        </div>
        <NewPropertyDialog onCreated={fetchProperties} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'available', 'occupied', 'maintenance'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors capitalize ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            {s === '' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-5 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <Building2 className="w-12 h-12 text-muted-foreground" />
          <div>
            <p className="font-medium">No properties found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter ? `No ${statusFilter} properties.` : 'Add your first property to get started.'}
            </p>
          </div>
          {!statusFilter && <NewPropertyDialog onCreated={fetchProperties} />}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {properties.map(p => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </div>
  )
}
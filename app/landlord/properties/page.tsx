'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Badge }   from '@/components/ui/badge'
import { Button }  from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Pencil, Trash2, Plus, BedDouble, Bath, MapPin } from 'lucide-react'

// ─── Uganda Districts ─────────────────────────────────────────────────────────
const UGANDA_DISTRICTS = [
  'Abim','Adjumani','Agago','Alebtong','Amolatar','Amudat','Amuria','Amuru',
  'Apac','Arua','Budaka','Bududa','Bugiri','Buhweju','Buikwe','Bukedea',
  'Bukomansimbi','Bukwa','Bulambuli','Buliisa','Bundibugyo','Bushenyi',
  'Busia','Butaleja','Butebo','Buvuma','Buyende','Dokolo','Gomba','Gulu',
  'Hoima','Ibanda','Iganga','Isingiro','Jinja','Kaabong','Kabale','Kabarole',
  'Kagadi','Kakumiro','Kalangala','Kaliro','Kalungu','Kampala','Kamuli',
  'Kamwenge','Kanungu','Kapchorwa','Kasanda','Kasese','Katakwi','Kayunga',
  'Kazo','Kibaale','Kiboga','Kibuku','Kikuube','Kiruhura','Kiryandongo',
  'Kisoro','Kitgum','Koboko','Kole','Kotido','Kumi','Kwania','Kyankwanzi',
  'Kyegegwa','Kyenjojo','Kyotera','Lamwo','Lira','Luuka','Luwero','Lwengo',
  'Lyantonde','Madi-Okollo','Manafwa','Maracha','Masaka','Masindi','Mayuge',
  'Mbale','Mbarara','Mitooma','Mityana','Moroto','Moyo','Mpigi','Mubende',
  'Mukono','Nabilatuk','Nakapiripirit','Nakaseke','Nakasongola','Namayingo',
  'Namisindwa','Namutumba','Napak','Nebbi','Ngora','Ntoroko','Ntungamo',
  'Nwoya','Obongi','Omoro','Otuke','Oyam','Pader','Pakwach','Pallisa',
  'Rakai','Rubanda','Rubirizi','Rukiga','Rukungiri','Rwampara','Sembabule',
  'Serere','Sheema','Sironko','Soroti','Tororo','Wakiso','Yumbe','Zombo',
].sort()

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = 'available' | 'unavailable' | 'rented'

interface Property {
  id:          string
  title:       string
  description: string
  location:    string
  district:    string
  price_ugx:   number
  bedrooms:    number
  bathrooms:   number
  status:      Status
  created_at:  string
}

type FormData = Omit<Property, 'id' | 'status' | 'created_at'>

const EMPTY_FORM: FormData = {
  title: '', description: '', location: '', district: '',
  price_ugx: 0, bedrooms: 1, bathrooms: 1,
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
  const variants: Record<Status, 'default' | 'secondary' | 'destructive'> = {
    available:   'default',
    rented:      'secondary',
    unavailable: 'destructive',
  }
  return <Badge variant={variants[status]}>{status}</Badge>
}

// ─── Property Form ────────────────────────────────────────────────────────────
function PropertyForm({
  initial,
  onSubmit,
  loading,
}: {
  initial: FormData
  onSubmit: (data: FormData) => void
  loading: boolean
}) {
  const [form, setForm] = useState<FormData>(initial)

  useEffect(() => { setForm(initial) }, [initial])

  const set = (field: keyof FormData, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={form.title}
            onChange={e => set('title', e.target.value)} placeholder="e.g. Spacious 2BR in Kololo" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Describe the property..." rows={3} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="location">Location / Street</Label>
            <Input id="location" value={form.location}
              onChange={e => set('location', e.target.value)} placeholder="e.g. Plot 12, Acacia Ave" />
          </div>

          <div className="space-y-1.5">
            <Label>District</Label>
            <Select value={form.district} onValueChange={v => set('district', v)}>
              <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {UGANDA_DISTRICTS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="price">Price (UGX / month)</Label>
          <Input id="price" type="number" min={0} value={form.price_ugx || ''}
            onChange={e => set('price_ugx', Number(e.target.value))}
            placeholder="e.g. 800000" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input id="bedrooms" type="number" min={0} max={20} value={form.bedrooms}
              onChange={e => set('bedrooms', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bathrooms">Bathrooms</Label>
            <Input id="bathrooms" type="number" min={0} max={20} value={form.bathrooms}
              onChange={e => set('bathrooms', Number(e.target.value))} />
          </div>
        </div>
      </div>

      <Button className="w-full" disabled={loading} onClick={() => onSubmit(form)}>
        {loading ? 'Saving…' : 'Save Property'}
      </Button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandlordPropertiesPage() {
  const supabase = createClientComponentClient()

  const [properties, setProperties] = useState<Property[]>([])
  const [loading,    setLoading]    = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing,    setEditing]    = useState<Property | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // ── Fetch own properties ──
  const fetchProperties = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }

    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', session.user.id)
      .order('created_at', { ascending: false })

    setProperties(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchProperties() }, [])

  // ── Create / Update ──
  const handleSubmit = async (formData: FormData) => {
    setFormLoading(true)

    const method = editing ? 'PATCH' : 'POST'
    const body   = editing ? { id: editing.id, ...formData } : formData

    const res = await fetch('/api/properties', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setFormLoading(false)

    if (res.ok) {
      setDialogOpen(false)
      setEditing(null)
      fetchProperties()
    }
  }

  // ── Soft delete ──
  const handleDelete = async (id: string) => {
    if (!confirm('Remove this property?')) return

    await fetch('/api/properties', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    fetchProperties()
  }

  const openAdd  = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (p: Property) => { setEditing(p); setDialogOpen(true) }

  const formatUGX = (n: number) =>
    'UGX ' + n.toLocaleString('en-UG')

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Properties</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {properties.length} listing{properties.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) setEditing(null) }}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Property' : 'Add New Property'}</DialogTitle>
            </DialogHeader>
            <PropertyForm
              initial={editing
                ? { title: editing.title, description: editing.description, location: editing.location,
                    district: editing.district, price_ugx: editing.price_ugx,
                    bedrooms: editing.bedrooms, bathrooms: editing.bathrooms }
                : EMPTY_FORM}
              onSubmit={handleSubmit}
              loading={formLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-20 text-muted-foreground">Loading…</div>
      )}

      {/* Empty state */}
      {!loading && properties.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">No properties yet.</p>
          <Button variant="link" onClick={openAdd}>Add your first listing</Button>
        </div>
      )}

      {/* Property cards */}
      {!loading && properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map(p => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug line-clamp-2">{p.title}</CardTitle>
                  <StatusBadge status={p.status} />
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{p.location}, {p.district}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-3.5 h-3.5" /> {p.bedrooms} bed
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5" /> {p.bathrooms} bath
                  </span>
                </div>
                <p className="font-semibold text-foreground text-base">
                  {formatUGX(p.price_ugx)}<span className="font-normal text-xs text-muted-foreground">/mo</span>
                </p>
              </CardContent>

              <CardFooter className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1"
                  onClick={() => openEdit(p)}>
                  <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                </Button>
                <Button size="sm" variant="destructive" className="flex-1"
                  onClick={() => handleDelete(p.id)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
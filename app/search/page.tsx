'use client'

import { useEffect, useState, useCallback } from 'react'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BedDouble, Bath, MapPin, SlidersHorizontal, X } from 'lucide-react'

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

const BEDROOM_OPTIONS = ['Any', '1', '2', '3', '4', '5+']

// ─── Types ────────────────────────────────────────────────────────────────────
interface Property {
  id:        string
  title:     string
  location:  string
  district:  string
  price_ugx: number
  bedrooms:  number
  bathrooms: number
  status:    string
}

interface Filters {
  district:  string
  min_price: string
  max_price: string
  bedrooms:  string
}

const EMPTY_FILTERS: Filters = {
  district: '', min_price: '', max_price: '', bedrooms: '',
}

// ─── Image Placeholder ────────────────────────────────────────────────────────
function PropertyImagePlaceholder({ title }: { title: string }) {
  // Deterministic pastel from title
  const hue = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return (
    <div
      className="w-full h-44 flex items-center justify-center rounded-t-xl overflow-hidden"
      style={{ background: `hsl(${hue} 40% 88%)` }}
    >
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="22" width="48" height="30" rx="3"
          fill={`hsl(${hue} 35% 70%)`} />
        <polygon points="28,4 52,22 4,22"
          fill={`hsl(${hue} 50% 60%)`} />
        <rect x="22" y="34" width="12" height="18" rx="1.5"
          fill={`hsl(${hue} 30% 55%)`} />
        <rect x="10" y="30" width="10" height="10" rx="1"
          fill={`hsl(${hue} 30% 55%)`} />
        <rect x="36" y="30" width="10" height="10" rx="1"
          fill={`hsl(${hue} 30% 55%)`} />
      </svg>
    </div>
  )
}

// ─── Property Card ────────────────────────────────────────────────────────────
function PropertyCard({ property }: { property: Property }) {
  const formatUGX = (n: number) => 'UGX ' + n.toLocaleString('en-UG')

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <PropertyImagePlaceholder title={property.title} />
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-1">{property.title}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{property.location}, {property.district}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="font-bold text-base">{formatUGX(property.price_ugx)}
            <span className="font-normal text-xs text-muted-foreground">/mo</span>
          </p>
          <Badge variant="outline" className="text-xs">Available</Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-2">
          <span className="flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5" />
            {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [filters,    setFilters]    = useState<Filters>(EMPTY_FILTERS)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading,    setLoading]    = useState(true)
  const [total,      setTotal]      = useState(0)

  const fetchProperties = useCallback(async (f: Filters) => {
    setLoading(true)

    const params = new URLSearchParams()
    if (f.district)  params.set('district',  f.district)
    if (f.min_price) params.set('min_price', f.min_price)
    if (f.max_price) params.set('max_price', f.max_price)
    if (f.bedrooms && f.bedrooms !== 'Any') {
      // "5+" → send 5 as min; backend can be extended for gte
      params.set('bedrooms', f.bedrooms.replace('+', ''))
    }

    const res  = await fetch(`/api/properties?${params.toString()}`)
    const json = await res.json()

    setProperties(json.data ?? [])
    setTotal(json.data?.length ?? 0)
    setLoading(false)
  }, [])

  // Initial load
  useEffect(() => { fetchProperties(EMPTY_FILTERS) }, [fetchProperties])

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }))

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    fetchProperties(EMPTY_FILTERS)
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / Filter bar */}
      <div className="border-b bg-muted/40">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter Properties</span>
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs"
                onClick={clearFilters}>
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* District */}
            <div className="space-y-1">
              <Label className="text-xs">District</Label>
              <Select
                value={filters.district || 'all'}
                onValueChange={v => setFilter('district', v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All districts" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All districts</SelectItem>
                  {UGANDA_DISTRICTS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Min Price */}
            <div className="space-y-1">
              <Label className="text-xs">Min Price (UGX)</Label>
              <Input
                className="h-9 text-sm"
                type="number" min={0}
                placeholder="e.g. 300000"
                value={filters.min_price}
                onChange={e => setFilter('min_price', e.target.value)}
              />
            </div>

            {/* Max Price */}
            <div className="space-y-1">
              <Label className="text-xs">Max Price (UGX)</Label>
              <Input
                className="h-9 text-sm"
                type="number" min={0}
                placeholder="e.g. 2000000"
                value={filters.max_price}
                onChange={e => setFilter('max_price', e.target.value)}
              />
            </div>

            {/* Bedrooms */}
            <div className="space-y-1">
              <Label className="text-xs">Bedrooms</Label>
              <Select
                value={filters.bedrooms || 'Any'}
                onValueChange={v => setFilter('bedrooms', v === 'Any' ? '' : v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {BEDROOM_OPTIONS.map(o => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="mt-4 w-full sm:w-auto"
            onClick={() => fetchProperties(filters)}
          >
            Search
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold">
            {loading ? 'Searching…' : `${total} propert${total !== 1 ? 'ies' : 'y'} found`}
          </h1>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-muted animate-pulse h-72" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && properties.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            <p className="text-lg font-medium">No properties match your filters.</p>
            <p className="text-sm mt-1">Try adjusting the search criteria.</p>
          </div>
        )}

        {/* Grid */}
        {!loading && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {properties.map(p => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
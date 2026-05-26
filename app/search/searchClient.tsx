'use client'
// ← remove `export const dynamic = 'force-dynamic'` from here

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// ── Uganda districts ─────────────────────────────────────────────────────────
const UGANDA_DISTRICTS = [
  'Abim', 'Adjumani', 'Agago', 'Alebtong', 'Amolatar', 'Amudat', 'Amuria',
  'Amuru', 'Apac', 'Arua', 'Budaka', 'Bududa', 'Bugiri', 'Buhweju',
  'Buikwe', 'Bukedea', 'Bukomansimbi', 'Bukwa', 'Bulambuli', 'Buliisa',
  'Bundibugyo', 'Bunyangabu', 'Bushenyi', 'Busia', 'Butaleja', 'Butebo',
  'Buvuma', 'Buyende', 'Dokolo', 'Gomba', 'Gulu', 'Hoima', 'Ibanda',
  'Iganga', 'Isingiro', 'Jinja', 'Kaabong', 'Kabale', 'Kabarole',
  'Kaberamaido', 'Kagadi', 'Kakumiro', 'Kalaki', 'Kalangala', 'Kaliro',
  'Kalungu', 'Kampala', 'Kamuli', 'Kamwenge', 'Kanungu', 'Kapchorwa',
  'Kapelebyong', 'Karenga', 'Kasese', 'Kasanda', 'Katakwi', 'Kayunga',
  'Kazo', 'Kibaale', 'Kiboga', 'Kibuku', 'Kikuube', 'Kiruhura', 'Kiryandongo',
  'Kisoro', 'Kitagwenda', 'Kitgum', 'Koboko', 'Kole', 'Kotido', 'Kumi',
  'Kwania', 'Kween', 'Kyankwanzi', 'Kyegegwa', 'Kyenjojo', 'Kyotera',
  'Lamwo', 'Lira', 'Luuka', 'Luwero', 'Lwengo', 'Lyantonde', 'Madi-Okollo',
  'Manafwa', 'Maracha', 'Masaka', 'Masindi', 'Mayuge', 'Mbale', 'Mbarara',
  'Mitooma', 'Mityana', 'Moroto', 'Moyo', 'Mpigi', 'Mubende', 'Mukono',
  'Nabilatuk', 'Nakapiripirit', 'Nakaseke', 'Nakasongola', 'Namayingo',
  'Namisindwa', 'Namutumba', 'Napak', 'Nebbi', 'Ngora', 'Ntoroko',
  'Ntungamo', 'Nwoya', 'Obongi', 'Omoro', 'Otuke', 'Oyam', 'Pader',
  'Pakwach', 'Pallisa', 'Rakai', 'Rubanda', 'Rubirizi', 'Rukiga',
  'Rukungiri', 'Rwampara', 'Sembabule', 'Serere', 'Sheema', 'Sironko',
  'Soroti', 'Tororo', 'Wakiso', 'Yumbe', 'Zombo',
] as const

const PROPERTY_TYPES = [
  { value: '', label: 'All types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'commercial', label: 'Commercial' },
] as const

const BEDROOMS_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4+' },
]

// ── UGX formatting ────────────────────────────────────────────────────────────
const fmtUGX = (v: number) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(v)

const MIN_RENT = 100_000
const MAX_RENT = 10_000_000
const RENT_STEP = 50_000

// ── Types ─────────────────────────────────────────────────────────────────────
interface Unit {
  id: string
  unit_number: string
  floor: number | null
  status: 'vacant' | 'occupied'
}

interface Property {
  id: string
  title: string
  description: string
  district: string
  address: string
  type: string
  bedrooms: number | null
  images: string[]
  vacant_unit_count: number
  units: Unit[]
  base_monthly_rent_ugx?: number
}

interface Filters {
  district: string
  type: string
  bedrooms: string
  minRent: number
  maxRent: number
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SearchClient() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<Filters>({
    district: searchParams.get('district') ?? '',
    type:     searchParams.get('type')     ?? '',
    bedrooms: searchParams.get('bedrooms') ?? '',
    minRent:  Number(searchParams.get('min_rent')) || MIN_RENT,
    maxRent:  Number(searchParams.get('max_rent')) || MAX_RENT,
  })

  const [properties, setProperties] = useState<Property[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const abortRef = useRef<AbortController | null>(null)

  const buildParams = useCallback((f: Filters) => {
    const p = new URLSearchParams()
    if (f.district) p.set('district', f.district)
    if (f.type)     p.set('type',     f.type)
    if (f.bedrooms) p.set('bedrooms', f.bedrooms)
    if (f.minRent > MIN_RENT) p.set('min_rent', String(f.minRent))
    if (f.maxRent < MAX_RENT) p.set('max_rent', String(f.maxRent))
    return p
  }, [])

  const fetchProperties = useCallback(async (f: Filters) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/properties/search?${buildParams(f)}`,
        { signal: ctrl.signal }
      )
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const json = await res.json()
      setProperties(json.data ?? [])
      setTotalCount(json.count ?? 0)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError('Failed to load properties. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  // Sync URL and fetch on filter change
  useEffect(() => {
    const params = buildParams(filters)
    router.replace(`/search?${params}`, { scroll: false })
    fetchProperties(filters)
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }))

  const clearFilters = () =>
    setFilters({ district: '', type: '', bedrooms: '', minRent: MIN_RENT, maxRent: MAX_RENT })

  const hasActiveFilters =
    filters.district || filters.type || filters.bedrooms ||
    filters.minRent > MIN_RENT || filters.maxRent < MAX_RENT

  return (
    <div className="min-h-screen bg-[#F5F2EE]">
      {/* Header */}
      <header className="bg-white border-b border-[#E0D9D0] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[#1A1612] tracking-tight">
            Property Search
          </h1>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-[#8B6F47] hover:text-[#1A1612] transition-colors underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* ── Filter Sidebar ─────────────────────────────────────────────── */}
        <aside className="w-72 shrink-0">
          <div className="bg-white rounded-2xl border border-[#E0D9D0] p-6 space-y-6 sticky top-6">
            <h2 className="text-sm font-semibold text-[#1A1612] uppercase tracking-widest">
              Filters
            </h2>

            {/* District */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#6B5744] uppercase tracking-wider">
                District
              </label>
              <select
                value={filters.district}
                onChange={(e) => setFilter('district', e.target.value)}
                className="w-full rounded-lg border border-[#D9CFC4] bg-[#FAF8F5] px-3 py-2.5 text-sm text-[#1A1612] focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="">All districts</option>
                {UGANDA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Property type */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#6B5744] uppercase tracking-wider">
                Property type
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {PROPERTY_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilter('type', value)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      filters.type === value
                        ? 'bg-[#8B6F47] text-white font-medium'
                        : 'bg-[#FAF8F5] text-[#4A3728] hover:bg-[#F0E8DE] border border-[#D9CFC4]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bedrooms */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#6B5744] uppercase tracking-wider">
                Bedrooms
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {BEDROOMS_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilter('bedrooms', value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      filters.bedrooms === value
                        ? 'bg-[#8B6F47] text-white font-medium'
                        : 'bg-[#FAF8F5] text-[#4A3728] hover:bg-[#F0E8DE] border border-[#D9CFC4]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rent range */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-[#6B5744] uppercase tracking-wider">
                Monthly rent (UGX)
              </label>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[#8B7355]">
                  <span>{fmtUGX(filters.minRent)}</span>
                  <span>{fmtUGX(filters.maxRent)}</span>
                </div>

                {/* Min slider */}
                <input
                  type="range"
                  min={MIN_RENT}
                  max={MAX_RENT}
                  step={RENT_STEP}
                  value={filters.minRent}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setFilter('minRent', Math.min(v, filters.maxRent - RENT_STEP))
                  }}
                  className="w-full accent-[#8B6F47] cursor-pointer"
                />

                {/* Max slider */}
                <input
                  type="range"
                  min={MIN_RENT}
                  max={MAX_RENT}
                  step={RENT_STEP}
                  value={filters.maxRent}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setFilter('maxRent', Math.max(v, filters.minRent + RENT_STEP))
                  }}
                  className="w-full accent-[#8B6F47] cursor-pointer"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-[#8B7355] mb-1 block">Min</label>
                  <input
                    type="number"
                    value={filters.minRent}
                    min={MIN_RENT}
                    max={filters.maxRent - RENT_STEP}
                    step={RENT_STEP}
                    onChange={(e) => setFilter('minRent', Number(e.target.value))}
                    className="w-full rounded-md border border-[#D9CFC4] bg-[#FAF8F5] px-2 py-1.5 text-xs text-[#1A1612] focus:outline-none focus:ring-1 focus:ring-[#8B6F47]"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-[#8B7355] mb-1 block">Max</label>
                  <input
                    type="number"
                    value={filters.maxRent}
                    min={filters.minRent + RENT_STEP}
                    max={MAX_RENT}
                    step={RENT_STEP}
                    onChange={(e) => setFilter('maxRent', Number(e.target.value))}
                    className="w-full rounded-md border border-[#D9CFC4] bg-[#FAF8F5] px-2 py-1.5 text-xs text-[#1A1612] focus:outline-none focus:ring-1 focus:ring-[#8B6F47]"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Results ────────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {/* Result count / status bar */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-[#6B5744]">
              {loading ? (
                <span className="animate-pulse">Searching…</span>
              ) : (
                <>
                  <span className="font-semibold text-[#1A1612]">{totalCount}</span>
                  {' '}propert{totalCount === 1 ? 'y' : 'ies'} with vacant units
                  {filters.district && (
                    <> in <span className="font-medium text-[#1A1612]">{filters.district}</span></>
                  )}
                </>
              )}
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          {/* Property grid */}
          {!loading && !error && properties.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-[#E8DDD4] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#8B6F47]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className="text-[#4A3728] font-medium">No properties found</p>
              <p className="text-[#8B7355] text-sm mt-1">Try adjusting filters</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}

            {/* Loading skeletons */}
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#E0D9D0] overflow-hidden animate-pulse">
                  <div className="h-44 bg-[#E8DDD4]" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-[#E8DDD4] rounded w-3/4" />
                    <div className="h-3 bg-[#E8DDD4] rounded w-1/2" />
                    <div className="h-3 bg-[#E8DDD4] rounded w-2/3" />
                  </div>
                </div>
              ))
            }
          </div>
        </main>
      </div>
    </div>
  )
}

// ── Property card ─────────────────────────────────────────────────────────────
function PropertyCard({ property }: { property: Property }) {
  const thumb = property.images?.[0]

  return (
    <a
      href={`/properties/${property.id}`}
      className="group bg-white rounded-2xl border border-[#E0D9D0] overflow-hidden hover:shadow-lg hover:border-[#C4B49A] transition-all duration-200 block"
    >
      {/* Image */}
      <div className="relative h-44 bg-[#E8DDD4] overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-[#B8A898]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}
        {/* Type badge */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#4A3728] text-xs font-medium px-2.5 py-1 rounded-full capitalize">
          {property.type}
        </span>
        {/* Vacant units badge */}
        <span className="absolute top-3 right-3 bg-[#2D6A4F]/90 text-white text-xs font-medium px-2.5 py-1 rounded-full">
          {property.vacant_unit_count} vacant
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-[#1A1612] text-base leading-snug line-clamp-1 group-hover:text-[#6B3F1A] transition-colors">
          {property.title}
        </h3>

        <div className="flex items-center gap-1 mt-1.5">
          <svg className="w-3.5 h-3.5 text-[#8B7355] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs text-[#8B7355] truncate">{property.district}, Uganda</span>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            {property.base_monthly_rent_ugx ? (
              <>
                <span className="text-lg font-bold text-[#1A1612]">
                  {fmtUGX(property.base_monthly_rent_ugx)}
                </span>
                <span className="text-xs text-[#8B7355] ml-1">/month</span>
              </>
            ) : (
              <span className="text-sm text-[#8B7355]">Rent on request</span>
            )}
          </div>
          {property.bedrooms && (
            <span className="text-xs text-[#6B5744] bg-[#F0E8DE] px-2.5 py-1 rounded-full">
              {property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </a>
  )
}
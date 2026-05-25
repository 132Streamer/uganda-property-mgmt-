import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Property } from '@/types/property'
import PropertyCard from '@/components/PropertyCard'
import SearchForm from '@/components/SearchForm'
import { Search, Home } from 'lucide-react'

interface SearchPageProps {
  searchParams: {
    district?: string
    bedrooms?: string
    max_price?: string
  }
}

async function getProperties(filters: SearchPageProps['searchParams']): Promise<Property[]> {
  const supabase = createClient()

  let query = (await supabase)
    .from('properties')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  if (filters.district && filters.district !== 'all') {
    query = query.ilike('district', filters.district)
  }

  if (filters.bedrooms) {
    const bedroomsNum = parseInt(filters.bedrooms)
    if (bedroomsNum === 4) {
      query = query.gte('bedrooms', 4)
    } else {
      query = query.eq('bedrooms', bedroomsNum)
    }
  }

  if (filters.max_price) {
    query = query.lte('price_ugx', parseInt(filters.max_price))
  }

  const { data, error } = await query
  if (error) {
    console.error('Search error:', error)
    return []
  }

  return data ?? []
}

function ResultCount({ count, filters }: { count: number; filters: SearchPageProps['searchParams'] }) {
  const hasFilters = filters.district || filters.bedrooms || filters.max_price
  return (
    <p className="text-stone-500 text-sm">
      {count > 0
        ? `${count} propert${count === 1 ? 'y' : 'ies'} found${hasFilters ? ' matching your filters' : ''}`
        : ''}
    </p>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const properties = await getProperties(searchParams)

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <div className="bg-stone-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-3 uppercase tracking-widest">
            <Home size={14} />
            <span>PropertyHub Uganda</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Find Your Next Home
          </h1>
          <p className="text-stone-400 text-base">
            Browse available rentals across Uganda&apos;s major districts
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Search Form */}
        <Suspense fallback={<div className="h-36 bg-white rounded-2xl animate-pulse" />}>
          <SearchForm />
        </Suspense>

        {/* Results header */}
        <div className="flex items-center justify-between mt-8 mb-5">
          <ResultCount count={properties.length} filters={searchParams} />
          {(searchParams.district || searchParams.bedrooms || searchParams.max_price) && (
            <div className="flex flex-wrap gap-2">
              {searchParams.district && searchParams.district !== 'all' && (
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {searchParams.district}
                </span>
              )}
              {searchParams.bedrooms && (
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {searchParams.bedrooms === '4' ? '4+ bed' : `${searchParams.bedrooms} bed`}
                </span>
              )}
              {searchParams.max_price && (
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                  Max UGX {parseInt(searchParams.max_price).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results grid */}
        {properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
              <Search size={28} className="text-stone-300" />
            </div>
            <h3 className="text-stone-700 font-semibold text-lg mb-1">
              No properties found in this area yet.
            </h3>
            <p className="text-stone-400 text-sm max-w-xs">
              Try adjusting your filters or check back later — new listings are added regularly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
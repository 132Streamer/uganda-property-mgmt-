'use client'

import { useCallback, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal } from 'lucide-react'

const DISTRICTS = ['Kampala', 'Wakiso', 'Mukono', 'Entebbe', 'Jinja', 'Mbarara']

const PRICE_OPTIONS = [
  { label: 'Any price', value: '' },
  { label: 'Up to UGX 500,000', value: '500000' },
  { label: 'Up to UGX 1,000,000', value: '1000000' },
  { label: 'Up to UGX 2,000,000', value: '2000000' },
  { label: 'Up to UGX 3,500,000', value: '3500000' },
  { label: 'Up to UGX 5,000,000', value: '5000000' },
  { label: 'Up to UGX 10,000,000', value: '10000000' },
]

export default function SearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const district = searchParams.get('district') ?? 'all'
  const bedrooms = searchParams.get('bedrooms') ?? ''
  const max_price = searchParams.get('max_price') ?? ''

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      startTransition(() => {
        router.push(`/search?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  const clearAll = () => {
    startTransition(() => {
      router.push('/search')
    })
  }

  const hasFilters = district !== 'all' || bedrooms || max_price

  return (
    <div className="bg-white rounded-2xl shadow-md border border-stone-100 p-6">
      <div className="flex items-center gap-2 mb-5 text-stone-700">
        <SlidersHorizontal size={18} className="text-amber-500" />
        <span className="font-semibold text-sm uppercase tracking-widest">Filter Properties</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* District */}
        <div>
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
            District
          </label>
          <select
            value={district}
            onChange={(e) => update('district', e.target.value === 'all' ? '' : e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
          >
            <option value="all">All Districts</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Bedrooms */}
        <div>
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
            Bedrooms
          </label>
          <select
            value={bedrooms}
            onChange={(e) => update('bedrooms', e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
          >
            <option value="">Any</option>
            <option value="1">1 Bedroom</option>
            <option value="2">2 Bedrooms</option>
            <option value="3">3 Bedrooms</option>
            <option value="4">4+ Bedrooms</option>
          </select>
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
            Max Price (UGX)
          </label>
          <select
            value={max_price}
            onChange={(e) => update('max_price', e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
          >
            {PRICE_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-stone-100">
        {hasFilters ? (
          <button
            onClick={clearAll}
            className="text-xs text-stone-400 hover:text-stone-700 underline underline-offset-2 transition"
          >
            Clear filters
          </button>
        ) : (
          <span />
        )}

        {isPending && (
          <span className="text-xs text-amber-500 flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin inline-block" />
            Searching…
          </span>
        )}
      </div>
    </div>
  )
}
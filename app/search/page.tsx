import { Suspense } from 'react'
import SearchClient from './searchClient'

export const dynamic = 'force-dynamic'

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F2EE] flex items-center justify-center">
        <p className="text-[#8B7355] animate-pulse">Loading search…</p>
      </div>
    }>
      <SearchClient />
    </Suspense>
  )
}
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Property {
  id: string
  title: string
  address: string
  district: string
  division: string | null
  bedrooms: number
  bathrooms: number
  rent_amount: number
  first_photo_url: string | null
  available_units: number
}

interface Filters {
  location: string
  min_price: number
  max_price: number
  bedrooms: string   // '', '1', '2', '3', '4'
  availability: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DISTRICTS = ['Kampala', 'Wakiso', 'Entebbe', 'Jinja', 'Mukono', 'Gulu', 'Mbarara']
const BEDROOM_OPTIONS = [
  { label: 'Any',  value: '' },
  { label: '1',    value: '1' },
  { label: '2',    value: '2' },
  { label: '3',    value: '3' },
  { label: '4+',   value: '4' },
]
const MAX_PRICE = 10_000_000   // UGX 10 M ceiling for slider
const PRICE_STEP = 50_000

const fmt = (n: number) =>
  new Intl.NumberFormat('en-UG', { style: 'decimal' }).format(n)

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="sk-img" />
      <div className="sk-body">
        <div className="sk-line sk-title" />
        <div className="sk-line sk-sub" />
        <div className="sk-line sk-sub short" />
        <div className="sk-footer">
          <div className="sk-line sk-price" />
          <div className="sk-btn" />
        </div>
      </div>
    </div>
  )
}

// ── Property card ─────────────────────────────────────────────────────────────
function PropertyCard({ p }: { p: Property }) {
  return (
    <article className="prop-card">
      <div className="card-img-wrap">
        {p.first_photo_url ? (
          <Image
            src={p.first_photo_url}
            alt={p.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="card-img"
          />
        ) : (
          <div className="card-img-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
              <path d="M9 21V12h6v9" />
            </svg>
          </div>
        )}
        {p.available_units > 0 && (
          <span className="availability-badge">
            {p.available_units} unit{p.available_units > 1 ? 's' : ''} free
          </span>
        )}
      </div>

      <div className="card-body">
        <h3 className="card-title">{p.title}</h3>
        <p className="card-location">
          <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
            <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.01 10 19 10 19s.11.01.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
          </svg>
          {p.district}{p.division ? `, ${p.division}` : ''}
        </p>
        <p className="card-address">{p.address}</p>

        <div className="card-meta">
          <span>
            <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            {p.bedrooms} bed{p.bedrooms !== 1 ? 's' : ''}
          </span>
          <span>
            <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
              <path fillRule="evenodd" d="M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1a2 2 0 00-2 2v1a2 2 0 00-2 2v.683a3.7 3.7 0 011.055.485 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0A3.7 3.7 0 0118 12.683V12a2 2 0 00-2-2V9a2 2 0 00-2-2V6a1 1 0 10-2 0v1h-1V6a1 1 0 10-2 0v1H8V6zm10 8.868a3.704 3.704 0 01-4.055-.036 1.704 1.704 0 00-1.89 0 3.704 3.704 0 01-4.11 0 1.704 1.704 0 00-1.89 0A3.7 3.7 0 012 14.868V17a1 1 0 001 1h14a1 1 0 001-1v-2.132z" clipRule="evenodd" />
            </svg>
            {p.bathrooms} bath{p.bathrooms !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="card-footer">
          <div className="card-price">
            <span className="currency">UGX</span>
            <span className="amount">{fmt(p.rent_amount)}</span>
            <span className="period">/mo</span>
          </div>
          <Link href={`/properties/${p.id}`} className="view-btn">
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [filters, setFilters] = useState<Filters>({
    location: '',
    min_price: 0,
    max_price: MAX_PRICE,
    bedrooms: '',
    availability: false,
  })
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchProperties = useCallback(async (f: Filters) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (f.location)       params.set('location',     f.location)
      if (f.min_price > 0)  params.set('min_price',    String(f.min_price))
      if (f.max_price < MAX_PRICE) params.set('max_price', String(f.max_price))
      if (f.bedrooms)       params.set('bedrooms',     f.bedrooms)
      if (f.availability)   params.set('availability', 'true')

      const res = await fetch(`/api/properties/search?${params.toString()}`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json = await res.json()
      setProperties(json.properties ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load properties')
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce filter changes (price slider)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchProperties(filters), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filters, fetchProperties])

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }))

  const resetFilters = () =>
    setFilters({ location: '', min_price: 0, max_price: MAX_PRICE, bedrooms: '', availability: false })

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const Sidebar = (
    <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">Filters</h2>
        <button className="reset-btn" onClick={resetFilters}>Reset</button>
      </div>

      {/* District */}
      <div className="filter-group">
        <label className="filter-label">District</label>
        <select
          className="filter-select"
          value={filters.location}
          onChange={(e) => set('location', e.target.value)}
        >
          <option value="">All districts</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div className="filter-group">
        <label className="filter-label">
          Price range
          <span className="filter-value-hint">
            UGX {fmt(filters.min_price)} – {filters.max_price >= MAX_PRICE ? 'Any' : `UGX ${fmt(filters.max_price)}`}
          </span>
        </label>
        <div className="range-wrap">
          <span className="range-tag">Min</span>
          <input
            type="range"
            min={0}
            max={MAX_PRICE}
            step={PRICE_STEP}
            value={filters.min_price}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (v <= filters.max_price) set('min_price', v)
            }}
            className="range-input"
          />
        </div>
        <div className="range-wrap">
          <span className="range-tag">Max</span>
          <input
            type="range"
            min={0}
            max={MAX_PRICE}
            step={PRICE_STEP}
            value={filters.max_price}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (v >= filters.min_price) set('max_price', v)
            }}
            className="range-input"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div className="filter-group">
        <label className="filter-label">Bedrooms</label>
        <div className="bed-options">
          {BEDROOM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`bed-btn ${filters.bedrooms === opt.value ? 'bed-btn--active' : ''}`}
              onClick={() => set('bedrooms', opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="filter-group filter-group--row">
        <label className="filter-label" htmlFor="avail-toggle">Available units only</label>
        <button
          id="avail-toggle"
          role="switch"
          aria-checked={filters.availability}
          className={`toggle ${filters.availability ? 'toggle--on' : ''}`}
          onClick={() => set('availability', !filters.availability)}
        >
          <span className="toggle-thumb" />
        </button>
      </div>
    </aside>
  )

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="page">
        {/* Top bar (mobile) */}
        <header className="topbar">
          <h1 className="topbar-title">Find a Property</h1>
          <button className="filter-toggle-btn" onClick={() => setSidebarOpen((o) => !o)}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3 5a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm2 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Filters
          </button>
        </header>

        {/* Backdrop (mobile) */}
        {sidebarOpen && (
          <div className="backdrop" onClick={() => setSidebarOpen(false)} />
        )}

        <div className="layout">
          {Sidebar}

          <main className="main">
            {/* Result count */}
            <div className="results-meta">
              {!loading && !error && (
                <span>{properties.length} propert{properties.length === 1 ? 'y' : 'ies'} found</span>
              )}
            </div>

            {error && (
              <div className="error-state">
                <p>{error}</p>
                <button onClick={() => fetchProperties(filters)}>Retry</button>
              </div>
            )}

            <div className="grid">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : properties.length === 0 && !error
                ? (
                  <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                      <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
                    </svg>
                    <p>No properties match your filters.</p>
                    <button onClick={resetFilters}>Clear filters</button>
                  </div>
                )
                : properties.map((p) => <PropertyCard key={p.id} p={p} />)
              }
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:          #F7F6F3;
    --surface:     #FFFFFF;
    --border:      #E4E2DC;
    --text:        #1A1A18;
    --text-muted:  #6B6A65;
    --accent:      #1E6B45;
    --accent-light:#E8F5EE;
    --accent-hover:#175937;
    --badge-bg:    #1E6B45;
    --badge-text:  #FFFFFF;
    --radius:      12px;
    --radius-sm:   8px;
    --shadow:      0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05);
    --sidebar-w:   272px;
    --font:        'Georgia', serif;
    --font-ui:     system-ui, -apple-system, sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-ui); }

  /* Page shell */
  .page { min-height: 100vh; display: flex; flex-direction: column; }

  /* Topbar */
  .topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; background: var(--surface); border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 30;
  }
  .topbar-title { font-family: var(--font); font-size: 1.2rem; font-weight: normal; letter-spacing: -0.02em; }
  .filter-toggle-btn {
    display: none; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: var(--radius-sm);
    border: 1px solid var(--border); background: var(--surface);
    font-size: 0.875rem; cursor: pointer; color: var(--text);
  }

  /* Layout */
  .layout { display: flex; flex: 1; max-width: 1280px; margin: 0 auto; width: 100%; padding: 24px 20px; gap: 24px; align-items: flex-start; }

  /* Sidebar */
  .sidebar {
    width: var(--sidebar-w); flex-shrink: 0;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 20px; position: sticky; top: 72px;
  }
  .sidebar-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .sidebar-title { font-family: var(--font); font-size: 1rem; font-weight: normal; }
  .reset-btn { font-size: 0.8rem; color: var(--accent); background: none; border: none; cursor: pointer; padding: 2px 4px; }
  .reset-btn:hover { text-decoration: underline; }

  /* Filter groups */
  .filter-group { margin-bottom: 22px; }
  .filter-group--row { display: flex; align-items: center; justify-content: space-between; }
  .filter-label {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--text-muted); margin-bottom: 10px;
  }
  .filter-value-hint { font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 0.78rem; color: var(--accent); }

  .filter-select {
    width: 100%; padding: 9px 12px; border: 1px solid var(--border);
    border-radius: var(--radius-sm); background: var(--bg); font-size: 0.9rem;
    color: var(--text); appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 20 20' fill='%236B6A65'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center; cursor: pointer;
  }
  .filter-select:focus { outline: 2px solid var(--accent); outline-offset: 1px; border-color: transparent; }

  /* Range */
  .range-wrap { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .range-tag { font-size: 0.75rem; color: var(--text-muted); width: 24px; flex-shrink: 0; }
  .range-input { flex: 1; accent-color: var(--accent); cursor: pointer; }

  /* Bedroom buttons */
  .bed-options { display: flex; gap: 8px; flex-wrap: wrap; }
  .bed-btn {
    flex: 1; min-width: 44px; padding: 7px 4px; border-radius: var(--radius-sm);
    border: 1px solid var(--border); background: var(--bg); font-size: 0.875rem;
    cursor: pointer; color: var(--text); transition: all 0.15s;
  }
  .bed-btn:hover { border-color: var(--accent); color: var(--accent); }
  .bed-btn--active { background: var(--accent); border-color: var(--accent); color: #fff; }

  /* Toggle */
  .toggle {
    width: 44px; height: 24px; border-radius: 12px; border: none;
    background: var(--border); cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0;
  }
  .toggle--on { background: var(--accent); }
  .toggle-thumb {
    position: absolute; top: 3px; left: 3px; width: 18px; height: 18px;
    border-radius: 50%; background: #fff; transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .toggle--on .toggle-thumb { transform: translateX(20px); }

  /* Main area */
  .main { flex: 1; min-width: 0; }
  .results-meta { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px; min-height: 20px; }

  /* Grid */
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }

  /* Property card */
  .prop-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    overflow: hidden; display: flex; flex-direction: column;
    box-shadow: var(--shadow); transition: transform 0.2s, box-shadow 0.2s;
  }
  .prop-card:hover { transform: translateY(-3px); box-shadow: 0 4px 20px rgba(0,0,0,0.1); }

  .card-img-wrap { position: relative; height: 190px; background: #EAE9E4; flex-shrink: 0; }
  .card-img { object-fit: cover; }
  .card-img-placeholder {
    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #C5C3BB;
  }
  .card-img-placeholder svg { width: 40px; height: 40px; }

  .availability-badge {
    position: absolute; top: 10px; right: 10px;
    background: var(--badge-bg); color: var(--badge-text);
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.03em;
    padding: 3px 9px; border-radius: 20px;
  }

  .card-body { padding: 14px 16px 16px; display: flex; flex-direction: column; flex: 1; }
  .card-title { font-family: var(--font); font-size: 1rem; font-weight: normal; margin-bottom: 5px; line-height: 1.3; }
  .card-location {
    display: flex; align-items: center; gap: 4px;
    font-size: 0.8rem; font-weight: 600; color: var(--accent); margin-bottom: 3px;
  }
  .card-address { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px; }

  .card-meta { display: flex; gap: 14px; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px; }
  .card-meta span { display: flex; align-items: center; gap: 4px; }

  .card-footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; }
  .card-price { display: flex; align-items: baseline; gap: 2px; }
  .currency { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; }
  .amount { font-size: 1.1rem; font-weight: 700; font-family: var(--font); letter-spacing: -0.02em; }
  .period { font-size: 0.75rem; color: var(--text-muted); }

  .view-btn {
    padding: 8px 16px; background: var(--accent); color: #fff;
    border-radius: var(--radius-sm); font-size: 0.82rem; font-weight: 500;
    text-decoration: none; transition: background 0.15s;
  }
  .view-btn:hover { background: var(--accent-hover); }

  /* Skeleton */
  @keyframes shimmer { 0% { background-position: -400px 0 } 100% { background-position: 400px 0 } }
  .skeleton-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden;
  }
  .sk-img { height: 190px; }
  .sk-body { padding: 14px 16px 16px; }
  .sk-line {
    border-radius: 4px; margin-bottom: 10px;
    background: linear-gradient(90deg, #EDECEA 25%, #E0DED9 50%, #EDECEA 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s infinite;
  }
  .sk-title { height: 18px; width: 75%; }
  .sk-sub   { height: 13px; width: 55%; }
  .sk-sub.short { width: 40%; }
  .sk-footer { display: flex; justify-content: space-between; margin-top: 14px; }
  .sk-price { height: 22px; width: 45%; margin-bottom: 0; }
  .sk-btn   { height: 32px; width: 30%; border-radius: var(--radius-sm);
    background: linear-gradient(90deg, #EDECEA 25%, #E0DED9 50%, #EDECEA 75%);
    background-size: 400px 100%; animation: shimmer 1.4s infinite;
  }

  /* Empty / error */
  .empty-state, .error-state {
    grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center;
    gap: 14px; padding: 60px 20px; color: var(--text-muted); text-align: center;
  }
  .empty-state button, .error-state button {
    padding: 8px 20px; background: var(--accent); color: #fff;
    border: none; border-radius: var(--radius-sm); cursor: pointer; font-size: 0.875rem;
  }

  /* Backdrop */
  .backdrop {
    display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 29;
  }

  /* ── Mobile ─────────────────────────────────────────────────────────── */
  @media (max-width: 768px) {
    .filter-toggle-btn { display: flex; }
    .layout { padding: 16px; }

    .sidebar {
      position: fixed; top: 0; left: 0; bottom: 0; width: 300px; max-width: 85vw;
      border-radius: 0; border: none; border-right: 1px solid var(--border);
      z-index: 40; overflow-y: auto; transform: translateX(-100%); transition: transform 0.3s ease;
    }
    .sidebar--open { transform: translateX(0); }
    .backdrop { display: block; }

    .grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 480px) {
    .topbar { padding: 12px 16px; }
    .grid { grid-template-columns: 1fr; }
  }
`
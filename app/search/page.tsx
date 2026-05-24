"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Search, SlidersHorizontal, X, Bed, Bath, MapPin, ChevronDown, Home, Building2, Warehouse, TreePine } from "lucide-react";

// ─── Supabase client ────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ───────────────────────────────────────────────────────────────────
type Property = {
  id: string;
  title: string;
  address: string;
  district: string;
  bedrooms: number;
  bathrooms: number;
  rent_per_month: number;
  property_type: string;
  status: string;
  photos: string[];
  description?: string;
  amenities?: string[];
};

type Filters = {
  query: string;
  district: string;
  bedrooms: string;
  max_rent: string;
  property_type: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────
const DISTRICTS = [
  "Kampala", "Wakiso", "Mukono", "Entebbe", "Jinja",
  "Gulu", "Mbarara", "Mbale", "Fort Portal", "Masaka",
];

const PROPERTY_TYPES = ["Apartment", "House", "Studio", "Villa", "Commercial"];

const PROPERTY_ICONS: Record<string, typeof Home> = {
  Apartment: Building2,
  House: Home,
  Studio: Warehouse,
  Villa: TreePine,
  Commercial: Building2,
};

function formatUGX(amount: number): string {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Property Card ────────────────────────────────────────────────────────────
function PropertyCard({ property, onClick }: { property: Property; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const TypeIcon = PROPERTY_ICONS[property.property_type] ?? Home;

  return (
    <article
      onClick={onClick}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {/* Photo */}
      <div className="relative h-52 bg-stone-100 overflow-hidden">
        {property.photos?.[0] && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.photos[0]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100">
            <TypeIcon className="w-12 h-12 text-stone-300" />
          </div>
        )}
        <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {property.property_type}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-stone-800 text-base leading-snug line-clamp-1 group-hover:text-amber-600 transition-colors">
            {property.title}
          </h3>
          <p className="text-stone-400 text-sm flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{property.address}, {property.district}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 text-stone-500 text-sm">
          <span className="flex items-center gap-1">
            <Bed className="w-4 h-4" />
            {property.bedrooms} {property.bedrooms === 1 ? "bed" : "beds"}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-4 h-4" />
            {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-stone-100">
          <div>
            <p className="text-xs text-stone-400">per month</p>
            <p className="text-amber-600 font-bold text-lg leading-tight">{formatUGX(property.rent_per_month)}</p>
          </div>
          <button className="bg-stone-900 text-white text-sm px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors font-medium">
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function PropertyDrawer({ property, onClose }: { property: Property; onClose: () => void }) {
  const [activePhoto, setActivePhoto] = useState(0);
  const photos = property.photos?.length ? property.photos : [];
  const TypeIcon = PROPERTY_ICONS[property.property_type] ?? Home;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[85vh] bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur rounded-full p-1.5 shadow-md hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5 text-stone-600" />
        </button>

        <div className="overflow-y-auto flex-1">
          {/* Photos */}
          <div className="relative h-64 sm:h-80 bg-stone-100 overflow-hidden">
            {photos.length > 0 ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photos[activePhoto]}
                  alt={`${property.title} photo ${activePhoto + 1}`}
                  className="w-full h-full object-cover"
                />
                {photos.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhoto(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === activePhoto ? "bg-white w-5" : "bg-white/50"}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100">
                <TypeIcon className="w-16 h-16 text-stone-300" />
              </div>
            )}

            <span className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              {property.property_type}
            </span>
          </div>

          {/* Details */}
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">{property.title}</h2>
              <p className="text-stone-500 flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                {property.address}, {property.district}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Bedrooms", value: property.bedrooms, icon: Bed },
                { label: "Bathrooms", value: property.bathrooms, icon: Bath },
                { label: "District", value: property.district, icon: MapPin },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-stone-50 rounded-2xl p-3 text-center">
                  <Icon className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-stone-900 font-semibold text-sm">{value}</p>
                  <p className="text-stone-400 text-xs">{label}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {property.description && (
              <div>
                <h3 className="font-semibold text-stone-800 mb-1.5">About</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities?.length ? (
              <div>
                <h3 className="font-semibold text-stone-800 mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <span key={a} className="bg-amber-50 text-amber-700 text-xs px-3 py-1 rounded-full border border-amber-100">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-stone-100 p-4 bg-white flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-stone-400">Monthly rent</p>
            <p className="text-amber-600 font-bold text-xl">{formatUGX(property.rent_per_month)}</p>
          </div>
          <button className="flex-1 max-w-xs bg-stone-900 text-white py-3 px-6 rounded-2xl font-semibold hover:bg-amber-600 transition-colors text-sm">
            Enquire Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-stone-100 flex items-center justify-center mb-4">
        <Home className="w-9 h-9 text-stone-300" />
      </div>
      <h3 className="text-stone-800 font-semibold text-lg mb-1">No properties found</h3>
      <p className="text-stone-400 text-sm max-w-xs">
        {hasFilters
          ? "Try adjusting your filters or search term."
          : "No available properties at the moment. Check back soon."}
      </p>
    </div>
  );
}

// ─── Select wrapper ───────────────────────────────────────────────────────────
function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white border border-stone-200 rounded-xl px-3 py-2.5 pr-8 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [filters, setFilters] = useState<Filters>({
    query: "",
    district: "",
    bedrooms: "",
    max_rent: "",
    property_type: "",
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Property | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("properties")
        .select("*")
        .eq("status", "available");

      if (filters.district) query = query.eq("district", filters.district);
      if (filters.property_type) query = query.eq("property_type", filters.property_type);
      if (filters.max_rent) query = query.lte("rent_per_month", Number(filters.max_rent));
      if (filters.bedrooms) {
        if (filters.bedrooms === "4+") {
          query = query.gte("bedrooms", 4);
        } else {
          query = query.eq("bedrooms", Number(filters.bedrooms));
        }
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      let results: Property[] = data ?? [];

      // Client-side full-text search across title, address, district
      if (filters.query.trim()) {
        const q = filters.query.toLowerCase();
        results = results.filter(
          (p) =>
            p.title?.toLowerCase().includes(q) ||
            p.address?.toLowerCase().includes(q) ||
            p.district?.toLowerCase().includes(q)
        );
      }

      setProperties(results);
    } catch (err) {
      console.error("Fetch error:", err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const id = setTimeout(fetchProperties, 300);
    return () => clearTimeout(id);
  }, [fetchProperties]);

  const hasFilters =
    !!filters.query ||
    !!filters.district ||
    !!filters.bedrooms ||
    !!filters.max_rent ||
    !!filters.property_type;

  const clearFilters = () =>
    setFilters({ query: "", district: "", bedrooms: "", max_rent: "", property_type: "" });

  const setFilter = (key: keyof Filters) => (value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400 pointer-events-none w-[18px] h-[18px]" />
              <input
                type="text"
                value={filters.query}
                onChange={(e) => setFilter("query")(e.target.value)}
                placeholder="Search by title, address or district…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:bg-white transition-colors"
              />
              {filters.query && (
                <button
                  onClick={() => setFilter("query")("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter toggle (mobile) */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`sm:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                showFilters || hasFilters
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "border-stone-200 text-stone-600 bg-white"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasFilters && (
                <span className="bg-white text-amber-600 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {Object.values(filters).filter((v) => v && v !== filters.query).length}
                </span>
              )}
            </button>
          </div>

          {/* Filters row — always visible on sm+, toggleable on mobile */}
          <div
            className={`${
              showFilters ? "flex" : "hidden"
            } sm:flex flex-wrap gap-2 mt-3`}
          >
            <FilterSelect
              value={filters.district}
              onChange={setFilter("district")}
              placeholder="All Districts"
              options={DISTRICTS.map((d) => ({ label: d, value: d }))}
            />
            <FilterSelect
              value={filters.bedrooms}
              onChange={setFilter("bedrooms")}
              placeholder="Any Bedrooms"
              options={["1", "2", "3", "4+"].map((b) => ({ label: `${b} bed${b === "1" ? "" : "s"}`, value: b }))}
            />
            <FilterSelect
              value={filters.property_type}
              onChange={setFilter("property_type")}
              placeholder="Any Type"
              options={PROPERTY_TYPES.map((t) => ({ label: t, value: t }))}
            />

            {/* Max rent input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-medium pointer-events-none">
                UGX
              </span>
              <input
                type="number"
                value={filters.max_rent}
                onChange={(e) => setFilter("max_rent")(e.target.value)}
                placeholder="Max rent"
                className="pl-10 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent w-36"
              />
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-stone-500 hover:text-red-500 flex items-center gap-1 px-2 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Results ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Count */}
        {!loading && (
          <p className="text-stone-400 text-sm mb-4">
            {properties.length === 0
              ? "No properties found"
              : `${properties.length} propert${properties.length === 1 ? "y" : "ies"} available`}
          </p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            // Skeleton
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-100 animate-pulse">
                <div className="h-52 bg-stone-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-stone-100 rounded-full w-3/4" />
                  <div className="h-3 bg-stone-100 rounded-full w-1/2" />
                  <div className="h-3 bg-stone-100 rounded-full w-1/3" />
                  <div className="h-8 bg-stone-100 rounded-xl" />
                </div>
              </div>
            ))
          ) : properties.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            properties.map((p) => (
              <PropertyCard key={p.id} property={p} onClick={() => setSelected(p)} />
            ))
          )}
        </div>
      </main>

      {/* ── Detail Drawer ── */}
      {selected && <PropertyDrawer property={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
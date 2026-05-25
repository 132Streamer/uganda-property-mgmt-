import { createClient } from '@/lib/supabase/server'
import { Property } from '@/types/property'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  MapPin,
  BedDouble,
  Bath,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Calendar,
  Home,
  Share2,
} from 'lucide-react'

interface PropertyDetailPageProps {
  params: { id: string }
}

async function getProperty(id: string): Promise<Property | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

function formatUGX(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const property = await getProperty(params.id)

  if (!property) notFound()

  const mainPhoto = property.photos?.[0] ?? '/placeholder-property.jpg'
  const extraPhotos = property.photos?.slice(1, 4) ?? []

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Nav */}
      <div className="bg-stone-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/search"
            className="flex items-center gap-1.5 text-stone-400 hover:text-white text-sm transition"
          >
            <ArrowLeft size={16} />
            Back to search
          </Link>
          <div className="flex items-center gap-1.5 text-amber-400 text-sm font-semibold">
            <Home size={14} />
            PropertyHub Uganda
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column — photos + details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Photos */}
            <div className="rounded-2xl overflow-hidden bg-stone-100">
              <div className="relative w-full h-72 sm:h-96">
                <Image
                  src={mainPhoto}
                  alt={property.title}
                  fill
                  className="object-cover"
                  priority
                  unoptimized={mainPhoto.startsWith('http')}
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              </div>
              {extraPhotos.length > 0 && (
                <div className={`grid gap-1 mt-1`}
                  style={{ gridTemplateColumns: `repeat(${extraPhotos.length}, 1fr)` }}
                >
                  {extraPhotos.map((photo, i) => (
                    <div key={i} className="relative h-28 bg-stone-200">
                      <Image
                        src={photo}
                        alt={`${property.title} photo ${i + 2}`}
                        fill
                        className="object-cover"
                        unoptimized={photo.startsWith('http')}
                        sizes="200px"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Location */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                  {property.title}
                </h1>
                <span className={`shrink-0 mt-1 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  property.status === 'available'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-stone-100 text-stone-500'
                }`}>
                  {property.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-500 mt-2">
                <MapPin size={15} className="text-amber-500 shrink-0" />
                <span>{property.address}, {property.district}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: BedDouble, label: 'Bedrooms', value: property.bedrooms },
                { icon: Bath, label: 'Bathrooms', value: property.bathrooms },
                { icon: Calendar, label: 'Status', value: property.status === 'available' ? 'Ready' : 'Occupied' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white rounded-xl p-4 border border-stone-100 text-center">
                  <Icon size={20} className="text-amber-500 mx-auto mb-1.5" />
                  <p className="text-stone-900 font-bold text-lg">{value}</p>
                  <p className="text-stone-400 text-xs uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {property.description && (
              <div className="bg-white rounded-2xl p-6 border border-stone-100">
                <h2 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-3">
                  About This Property
                </h2>
                <p className="text-stone-700 leading-relaxed text-sm">
                  {property.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-stone-100">
                <h2 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">
                  Amenities
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {property.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 text-stone-700 text-sm">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — pricing & CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Price card */}
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
                <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Monthly Rent</p>
                <p className="text-3xl font-bold text-amber-600 mb-1">
                  {formatUGX(property.price_ugx)}
                </p>
                <p className="text-stone-400 text-xs">per month</p>

                <div className="border-t border-stone-100 my-4" />

                {/* Pay as Guest CTA */}
                <Link
                  href={`/properties/${property.id}/pay`}
                  className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl transition-colors duration-200 text-sm"
                >
                  <CreditCard size={17} />
                  Pay as Guest
                </Link>

                <p className="text-center text-stone-400 text-xs mt-3">
                  No account required. Secure payment via mobile money.
                </p>

                <div className="border-t border-stone-100 my-4" />

                <div className="space-y-2 text-sm text-stone-600">
                  <div className="flex justify-between">
                    <span className="text-stone-400">District</span>
                    <span className="font-medium">{property.district}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Bedrooms</span>
                    <span className="font-medium">{property.bedrooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Bathrooms</span>
                    <span className="font-medium">{property.bathrooms}</span>
                  </div>
                </div>
              </div>

              {/* Back link */}
              <Link
                href="/search"
                className="flex items-center justify-center gap-2 w-full border border-stone-200 hover:bg-stone-50 text-stone-700 text-sm font-medium py-3 rounded-xl transition"
              >
                <ArrowLeft size={15} />
                Browse more properties
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
import Link from 'next/link'
import Image from 'next/image'
import { Property } from '@/types/property'
import { BedDouble, MapPin, ArrowRight } from 'lucide-react'

function formatUGX(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function PropertyCard({ property }: { property: Property }) {
  const photo = property.photos?.[0] ?? '/placeholder-property.jpg'

  return (
    <article className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      {/* Photo */}
      <div className="relative h-52 w-full overflow-hidden bg-stone-100">
        <Image
          src={photo}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized={photo.startsWith('http')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
          Available
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-stone-900 text-lg leading-snug line-clamp-1 mb-1">
          {property.title}
        </h3>

        <div className="flex items-center gap-1 text-stone-500 text-sm mb-3">
          <MapPin size={13} className="shrink-0 text-amber-500" />
          <span className="line-clamp-1">{property.address}, {property.district}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-0.5">Monthly Rent</p>
            <p className="text-amber-600 font-bold text-lg">{formatUGX(property.price_ugx)}</p>
          </div>

          <div className="flex items-center gap-3 text-stone-500 text-sm">
            <span className="flex items-center gap-1">
              <BedDouble size={15} className="text-stone-400" />
              {property.bedrooms} bd
            </span>
          </div>
        </div>

        <Link
          href={`/properties/${property.id}`}
          className="mt-4 flex items-center justify-center gap-2 w-full bg-stone-900 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors duration-200"
        >
          View Details
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  )
}
export type Property = {
  id: string
  title: string
  description: string
  district: string
  address: string
  price_ugx: number
  bedrooms: number
  bathrooms: number
  status: 'available' | 'occupied' | 'maintenance'
  photos: string[]
  amenities: string[]
  landlord_id: string
  created_at: string
  updated_at: string
}

export type SearchFilters = {
  district?: string
  bedrooms?: number
  max_price?: number
}
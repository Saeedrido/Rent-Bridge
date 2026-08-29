import type { ListingType, PropertyType } from '../../properties/types/property'

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'beds-desc'

export interface SearchFilters {
  query: string
  listingType: ListingType | 'all'
  propertyType: PropertyType | 'all'
  location: string
  minPrice: number | null
  maxPrice: number | null
  beds: number | null
  baths: number | null
  amenities: string[]
  verifiedOnly: boolean
  sort: SortOption
}

export const defaultFilters: SearchFilters = {
  query: '',
  listingType: 'all',
  propertyType: 'all',
  location: '',
  minPrice: null,
  maxPrice: null,
  beds: null,
  baths: null,
  amenities: [],
  verifiedOnly: false,
  sort: 'newest',
}

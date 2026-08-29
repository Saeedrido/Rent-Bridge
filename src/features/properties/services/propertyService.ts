import { properties } from '../data/properties'
import type { Property } from '../types/property'
import type { SearchFilters } from '../../search/types/search'

function applyFilters(list: Property[], filters: SearchFilters): Property[] {
  const query = filters.query.trim().toLowerCase()

  return list.filter((p) => {
    if (filters.listingType !== 'all' && p.listingType !== filters.listingType) return false
    if (filters.propertyType !== 'all' && p.propertyType !== filters.propertyType) return false
    if (filters.location && !`${p.location}, ${p.city}, ${p.state}`.toLowerCase().includes(filters.location.toLowerCase()))
      return false
    if (filters.minPrice !== null && p.price < filters.minPrice) return false
    if (filters.maxPrice !== null && p.price > filters.maxPrice) return false
    if (filters.beds !== null && p.beds < filters.beds) return false
    if (filters.baths !== null && p.baths < filters.baths) return false
    if (filters.verifiedOnly && !p.verified) return false
    if (
      filters.amenities.length > 0 &&
      !filters.amenities.every((a) => p.amenities.includes(a))
    )
      return false
    if (query) {
      const haystack = `${p.title} ${p.location} ${p.city} ${p.state} ${p.propertyType}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })
}

function applySort(list: Property[], sort: SearchFilters['sort']): Property[] {
  const sorted = [...list]
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price)
    case 'beds-desc':
      return sorted.sort((a, b) => b.beds - a.beds)
    case 'newest':
    default:
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}

export const propertyService = {
  async getProperties(filters?: SearchFilters): Promise<Property[]> {
    return this.getPropertiesSync(filters)
  },

  getPropertiesSync(filters?: SearchFilters): Property[] {
    let list = properties
    if (filters) list = applySort(applyFilters(list, filters), filters.sort)
    return list
  },

  async getPropertyBySlug(slug: string): Promise<Property | null> {
    return properties.find((p) => p.slug === slug) ?? null
  },

  async getFeatured(limit = 3): Promise<Property[]> {
    return properties.filter((p) => p.featured).slice(0, limit)
  },

  async getRelated(property: Property, limit = 3): Promise<Property[]> {
    return properties
      .filter((p) => p.id !== property.id && p.city === property.city)
      .slice(0, limit)
  },
}

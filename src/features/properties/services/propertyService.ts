import type { Property } from '../types/property'
import type { SearchFilters } from '../../search/types/search'
import { searchListings, getListing, ListingStatus } from '@/services/api/listingApi'
import { withFallback, apiErrorMessage } from '@/services/api/fallback'
import { listingToProperty } from '@/services/api/mappers'

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

async function loadLiveListings(): Promise<Property[]> {
  const payload = await searchListings({
    Page: 1,
    PageSize: 100,
    Status: ListingStatus.Published,
    MinPrice: undefined,
    MaxPrice: undefined,
  })
  return payload.map((item) => listingToProperty(item))
}

export const propertyService = {
  async getProperties(filters?: SearchFilters): Promise<Property[]> {
    return withFallback(
      async () => {
        const items = await loadLiveListings()
        if (!filters) return items
        return applySort(applyFilters(items, filters), filters.sort)
      },
      { fallback: () => [] },
    )
  },

  async getPropertiesWithError(filters?: SearchFilters): Promise<{ data: Property[]; error: string | null }> {
    try {
      const items = await loadLiveListings()
      if (!filters) return { data: items, error: null }
      return { data: applySort(applyFilters(items, filters), filters.sort), error: null }
    } catch (err) {
      return { data: [], error: apiErrorMessage(err) }
    }
  },

  async getPropertyBySlug(slug: string): Promise<Property | null> {
    return withFallback(
      async () => {
        const items = await loadLiveListings()
        return items.find((p) => p.slug === slug) ?? null
      },
      { fallback: () => null, emptyWhen: (value) => value === null },
    )
  },

  async getPropertyBySlugWithError(slug: string): Promise<{ data: Property | null; error: string | null }> {
    try {
      const items = await loadLiveListings()
      return { data: items.find((p) => p.slug === slug) ?? null, error: null }
    } catch (err) {
      return { data: null, error: apiErrorMessage(err) }
    }
  },

  async getFeatured(limit = 3): Promise<Property[]> {
    return withFallback(
      async () => {
        const items = await loadLiveListings()
        const featured = items.filter((p) => p.featured)
        const rest = items.filter((p) => !p.featured)
        return [...featured, ...rest].slice(0, limit)
      },
      { fallback: () => [] },
    )
  },

  async getRelated(property: Property, limit = 3): Promise<Property[]> {
    return withFallback(
      async () => {
        const items = await loadLiveListings()
        return items.filter((p) => p.id !== property.id && p.city === property.city).slice(0, limit)
      },
      {
        fallback: () => [],
        emptyWhen: (value) => value.length === 0,
      },
    )
  },

  async findById(id: string): Promise<Property | null> {
    return withFallback(
      async () => {
        const detail = await getListing(id)
        return listingToProperty(detail)
      },
      { fallback: () => null, emptyWhen: (value) => value === null },
    )
  },
}

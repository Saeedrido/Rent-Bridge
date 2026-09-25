import { useCallback, useEffect, useState } from 'react'
import { defaultFilters, type SearchFilters, type SortOption } from '../types/search'
import type { ListingType, PropertyType } from '../../properties/types/property'
import type { Property } from '../../properties/types/property'
import { propertyService } from '../../properties/services/propertyService'

export function useSearchFilters(initial?: Partial<SearchFilters>) {
  const [filters, setFilters] = useState<SearchFilters>({ ...defaultFilters, ...initial })
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const key = JSON.stringify(filters)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    propertyService.getPropertiesWithError(filters).then((result) => {
      if (active) {
        setProperties(result.data)
        setError(result.error)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [key])

  const updateFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleAmenity = useCallback((amenity: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }, [])

  const reset = useCallback(() => setFilters({ ...defaultFilters, ...initial }), [initial])

  return { filters, updateFilter, toggleAmenity, reset, properties, loading, error, results: properties }
}

export type { SearchFilters, SortOption, ListingType, PropertyType }

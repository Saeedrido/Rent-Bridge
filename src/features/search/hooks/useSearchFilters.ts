import { useCallback, useMemo, useState } from 'react'
import { defaultFilters, type SearchFilters, type SortOption } from '../types/search'
import type { ListingType, PropertyType } from '../../properties/types/property'
import { propertyService } from '../../properties/services/propertyService'

export function useSearchFilters(initial?: Partial<SearchFilters>) {
  const [filters, setFilters] = useState<SearchFilters>({ ...defaultFilters, ...initial })

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

  const results = useMemo(() => {
    // Synchronous derivation for instant UI; service call is reserved for the API upgrade.
    return filters
  }, [filters])

  const properties = useMemo(() => {
    return propertyService.getPropertiesSync(filters)
  }, [filters])

  return { filters, updateFilter, toggleAmenity, reset, properties, results }
}

export type { SearchFilters, SortOption, ListingType, PropertyType }

import { useEffect, useState } from 'react'
import { propertyService } from '../services/propertyService'
import type { Property } from '../types/property'
import type { SearchFilters } from '../../search/types/search'

export function useProperties(filters?: SearchFilters) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const key = filters ? JSON.stringify(filters) : 'all'

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

  return { properties, loading, error }
}

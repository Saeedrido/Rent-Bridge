import { useEffect, useState } from 'react'
import { propertyService } from '../services/propertyService'
import type { Property } from '../types/property'
import type { SearchFilters } from '../../search/types/search'

export function useProperties(filters?: SearchFilters) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const key = filters ? JSON.stringify(filters) : 'all'

  useEffect(() => {
    let active = true
    setLoading(true)
    propertyService.getProperties(filters).then((data) => {
      if (active) {
        setProperties(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [key])

  return { properties, loading }
}

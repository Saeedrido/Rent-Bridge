import { useEffect, useState } from 'react'
import { propertyService } from '../services/propertyService'
import type { Property } from '../types/property'

export function useProperty(slug: string | undefined) {
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    propertyService.getPropertyBySlugWithError(slug ?? '').then((result) => {
      if (active) {
        setProperty(result.data)
        setError(result.error)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [slug])

  return { property, loading, error }
}

import { useEffect, useState } from 'react'
import { propertyService } from '../services/propertyService'
import type { Property } from '../types/property'

export function useProperty(slug: string | undefined) {
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    propertyService.getPropertyBySlug(slug ?? '').then((data) => {
      if (active) {
        setProperty(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [slug])

  return { property, loading }
}

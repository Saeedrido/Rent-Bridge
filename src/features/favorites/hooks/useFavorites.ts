import { useCallback, useMemo } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'

export interface FavoriteMeta {
  savedAt: string
  availableFrom?: string
}

export function useFavorites() {
  const [entries, setEntries] = useLocalStorage<Record<string, FavoriteMeta>>('rb:favorites', {})

  const favorites = useMemo(() => Object.keys(entries), [entries])

  const isFavorite = useCallback((id: string) => Boolean(entries[id]), [entries])

  const savedAt = useCallback((id: string): string | undefined => entries[id]?.savedAt, [entries])

  const toggle = useCallback(
    (id: string, meta?: Partial<FavoriteMeta>) => {
      setEntries((prev) => {
        if (prev[id]) {
          const next = { ...prev }
          delete next[id]
          return next
        }
        return { ...prev, [id]: { savedAt: new Date().toISOString(), ...meta } }
      })
    },
    [setEntries],
  )

  return { favorites, isFavorite, savedAt, toggle }
}

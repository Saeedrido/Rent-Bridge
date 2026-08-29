import { useCallback } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'

export function useFavorites() {
  const [ids, setIds] = useLocalStorage<string[]>('rb:favorites', [])

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids])

  const toggle = useCallback(
    (id: string) => {
      setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    },
    [setIds],
  )

  return { favorites: ids, isFavorite, toggle }
}

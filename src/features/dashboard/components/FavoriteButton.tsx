import { cn } from '../../../utils/cn'
import { useFavorites } from '../../../features/favorites/hooks/useFavorites'
import { useToast } from './ToastProvider'
import { HeartIcon } from './icons'

export function FavoriteButton({ id, className }: { id: string; className?: string }) {
  const { isFavorite, toggle } = useFavorites()
  const showToast = useToast()
  const active = isFavorite(id)

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const willSave = !active
        toggle(id)
        if (willSave) showToast('Saved')
      }}
      aria-label={active ? 'Remove from favorites' : 'Save to favorites'}
      aria-pressed={active}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition-colors hover:bg-white',
        className,
      )}
    >
      <HeartIcon filled={active} />
    </button>
  )
}

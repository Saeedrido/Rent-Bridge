import { cn } from '../../../utils/cn'
import type { Role } from './roles'

interface RoleCardProps {
  role: Role
  selected: boolean
  onSelect: (id: string) => void
}

export function RoleCard({ role, selected, onSelect }: RoleCardProps) {
  const { Icon, label } = role
  return (
    <button
      type="button"
      onClick={() => onSelect(role.id)}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center gap-4 rounded-card px-6 py-6 text-left transition-colors',
        selected
          ? 'border-2 border-orange bg-white shadow-sm'
          : 'border border-green/20 bg-white hover:border-green/40',
      )}
    >
      <Icon className={cn('shrink-0', selected ? 'text-orange' : 'text-green-dark')} />
      <span className="text-lg font-semibold text-green-dark">{label}</span>
    </button>
  )
}

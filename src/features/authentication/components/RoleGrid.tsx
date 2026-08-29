import { ROLES } from './roles'
import { RoleCard } from './RoleCard'

interface RoleGridProps {
  selected: string
  onSelect: (id: string) => void
}

export function RoleGrid({ selected, onSelect }: RoleGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {ROLES.map((role) => (
        <RoleCard key={role.id} role={role} selected={selected === role.id} onSelect={onSelect} />
      ))}
    </div>
  )
}

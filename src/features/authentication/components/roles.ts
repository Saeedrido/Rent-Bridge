import type { ComponentType } from 'react'
import { KeyIcon, PersonIcon, HouseIcon, ScalesIcon } from './roleIcons'

export interface Role {
  id: string
  label: string
  Icon: ComponentType<{ className?: string }>
}

export const ROLES: Role[] = [
  { id: 'tenant', label: 'Tenant', Icon: PersonIcon },
  { id: 'landlord', label: 'Landlord', Icon: HouseIcon },
  { id: 'caretaker', label: 'Caretaker', Icon: KeyIcon },
  { id: 'lawyer', label: 'Lawyer', Icon: ScalesIcon },
]

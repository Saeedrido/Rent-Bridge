import type { ComponentType } from 'react'
import { HeartOutlineIcon, HouseIcon, PersonIcon, ScalesIcon } from './roleIcons'

export interface Role {
  id: string
  label: string
  Icon: ComponentType<{ className?: string }>
}

export const ROLES: Role[] = [
  { id: 'tenant', label: 'Tenant', Icon: PersonIcon },
  { id: 'landlord', label: 'Landlord', Icon: HouseIcon },
  { id: 'agent', label: 'Agent or Caretaker', Icon: HeartOutlineIcon },
  { id: 'lawyer', label: 'Lawyer', Icon: ScalesIcon },
]

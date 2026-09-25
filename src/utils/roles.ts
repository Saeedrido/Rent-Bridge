import { getUser } from '../services/api/tokens'

export function roleDashboardPath(roleId: string): string {
  switch (roleId) {
    case 'landlord':
      return '/dashboard/landlord'
    case 'caretaker':
      return '/dashboard/caretaker'
    case 'agent':
      return '/dashboard/agent'
    case 'lawyer':
      return '/dashboard/lawyer'
    case 'admin':
      return '/dashboard/admin'
    case 'tenant':
    default:
      return '/dashboard'
  }
}

export function currentRoleId(): string {
  const user = getUser()
  const role =
    user?.role?.trim().toLowerCase() || sessionStorage.getItem('rb:role')?.trim().toLowerCase() || ''
  switch (role) {
    case 'landlord':
      return 'landlord'
    case 'caretaker':
      return 'caretaker'
    case 'agent':
      return 'agent'
    case 'lawyer':
      return 'lawyer'
    case 'admin':
      return 'admin'
    default:
      return 'tenant'
  }
}
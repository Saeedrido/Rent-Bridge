export type UserRole = 'tenant' | 'landlord' | 'agent' | 'lawyer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

export type UserRole = 'tenant' | 'landlord' | 'caretaker' | 'lawyer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

import type { User } from '../../authentication/types/user'

export interface Profile extends User {
  phone?: string
  savedSearches: number
  viewingRequests: number
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Booking {
  id: string
  propertyId: string
  propertySlug: string
  propertyTitle: string
  name: string
  email: string
  phone: string
  preferredDate: string
  message: string
  status: BookingStatus
  createdAt: string
}

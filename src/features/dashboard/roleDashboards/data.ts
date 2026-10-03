export interface ManagedProperty {
  id: string
  listingId?: string
  title: string
  location: string
  rent: number
  beds: number
  baths: number
  typeLabel: string
  image: string
  published: boolean
  verified: boolean
  description: string
}

export interface InspectionRequest {
  id: string
  tenant: string
  propertyId: string
  slot: string
  status: 'pending' | 'confirmed' | 'declined' | 'completed'
  /** ISO date the inspection is booked for, when confirmed. */
  scheduledDate?: string
  /** ISO date the inspection actually happened, when completed. */
  actualDate?: string
}

export interface AgreementRecord {
  id: string
  propertyTitle: string
  tenant: string
  lawyer: string
  status: 'draft' | 'with-lawyer' | 'certified' | 'partially-signed' | 'signed'
  /** e.g. ['Tenant'] — parties that have already signed. */
  signedParties: string[]
  updated: string
}

export interface PaymentRecord {
  id: string
  tenant: string
  propertyTitle: string
  amount: number
  date: string
  status: 'paid' | 'pending'
}

export type ReviewStatus = 'in-review' | 'waiting' | 'signed'

export interface NewListing {
  id: string
  title: string
  location: string
  lister: string
  rent: number
  image: string
}

export interface QueueItem {
  id: string
  shortTitle: string
  party: string
  landlord: string
  rent: number
  submitted: string
  status: ReviewStatus
}

export const naira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`
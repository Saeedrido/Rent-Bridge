export interface ManagedProperty {
  id: string
  listingId?: string
  title: string
  location: string
  rent: number
  rentFrequency?: 'monthly' | 'quarterly' | 'semi-annually' | 'annually'
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
  status: 'pending' | 'confirmed' | 'declined' | 'completed' | 'reschedule-requested'
  /** ISO date the inspection is booked for, when confirmed. */
  scheduledDate?: string
  /** ISO date the inspection actually happened, when completed. */
  actualDate?: string
  /** Proposed new date when tenant requests reschedule (status: 'reschedule-requested'). */
  proposedDate?: string
  /** Optional note from tenant about why they want to reschedule. */
  rescheduleNote?: string
}

export interface AgreementRecord {
  id: string
  propertyTitle: string
  tenant: string
  lawyer: string
  status:
    | 'draft'
    | 'with-lawyer'
    | 'certified'
    | 'partially-signed'
    | 'signed'
    /** Document flow: lawyer uploaded, landlord is signing. */
    | 'landlord-signing'
    /** Document flow: landlord returned it, awaiting the lawyer. */
    | 'landlord-review'
    /** Document flow: landlord approved, tenant is signing. */
    | 'tenant-signing'
    /** Document flow: tenant returned it, awaiting the lawyer. */
    | 'tenant-review'
  /** e.g. ['Tenant'] — parties that have already signed. */
  signedParties: string[]
  updated: string
  /** Per-party document progress, when the lease uses the document flow. */
  progress?: AgreementProgress
}

/** A single party's document-signing progress on a lease. */
export interface AgreementReviewProgress {
  party: string
  downloaded: boolean
  uploaded: boolean
  submitted: boolean
  approved: boolean
  downloadedAt?: string
  uploadedAt?: string
  submittedAt?: string
  approvedAt?: string
  /** URL of the file the party uploaded (hosted). */
  uploadedUrl?: string
  uploadedFileName?: string
}

/**
 * Document-based signing progress for a lease, as returned by the API on both
 * the lease list and the lease/agreement detail. Every dashboard reads this so
 * they cannot disagree about which step a lease is on.
 */
export interface AgreementProgress {
  hasOriginalDocument: boolean
  originalDocumentUrl?: string
  originalDocumentFileName?: string
  originalDocumentUploadedAt?: string
  /** True once both parties signed and the lawyer approved — the final copy is retained. */
  isFinalized: boolean
  finalDocumentUrl?: string
  finalDocumentFileName?: string
  finalizedAt?: string
  landlord: AgreementReviewProgress
  tenant: AgreementReviewProgress
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
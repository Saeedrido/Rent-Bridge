import type { DashboardProperty } from '../data/dashboardProperties'

export interface Inspection {
  id: string
  propertyId: string
  propertyTitle: string
  propertyLocation: string
  landlordName: string
  status: 'requested' | 'confirmed' | 'lawyer-review' | 'signed' | 'cancelled'
  requestedDate: string
  scheduledDate?: string
  confirmedDate?: string
  lawyerReviewDate?: string
  signedDate?: string
  cancelledDate?: string
}

export interface Payment {
  id: string
  type: 'rent' | 'commission' | 'legal' | 'caution' | 'verification' | 'inspection-deposit'
  propertyId?: string
  propertyTitle?: string
  propertyLocation?: string
  amount: number
  status: 'paid' | 'awaiting' | 'pending' | 'refunded' | 'failed'
  date: string
  description: string
}

export interface SavedProperty extends DashboardProperty {
  savedAt: string
  availableFrom?: string
}

export interface AgreementClause {
  number: number
  title: string
  content: string
  flagged: boolean
  status: 'pending' | 'approved' | 'updated' | 'flagged'
  note?: string
  proposedEdit?: string
}

export interface AgreementFeedback {
  id: string
  type: 'flagged' | 'note' | 'approved' | 'updated'
  clauseRef: number
  message: string
  proposedEdit?: string
}

export interface AgreementLawyer {
  name: string
  initials: string
  barNumber: string
  reviewingSince: string
}

export interface TenantAgreement {
  id: string
  propertyId: string
  propertyTitle: string
  propertyLocation: string
  term: string
  date: string
  status: 'draft' | 'lawyer-review' | 'awaiting-tenant' | 'signed'
  /** Parties that have already signed, e.g. ['Landlord']. Drives the pay gate. */
  signedParties: string[]
  lawyer: AgreementLawyer
  clauses: AgreementClause[]
  feedback: AgreementFeedback[]
  totalAmount: number
}

export function getAgreementStatus(status: string) {
  switch (status) {
    case 'draft':
      return { tone: 'draft' as const, label: 'DRAFT' }
    case 'lawyer-review':
      return { tone: 'inreview' as const, label: 'LAWYER REVIEW' }
    case 'awaiting-tenant':
      return { tone: 'inreview' as const, label: 'AWAITING TENANT' }
    case 'signed':
      return { tone: 'signed' as const, label: 'SIGNED' }
    default:
      return { tone: 'neutral' as const, label: status.toUpperCase() }
  }
}

export function getPaymentStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return { tone: 'paid' as const, label: 'PAID' }
    case 'awaiting':
      return { tone: 'awaiting' as const, label: 'AWAITING' }
    case 'pending':
      return { tone: 'pending' as const, label: 'PENDING' }
    case 'refunded':
      return { tone: 'refunded' as const, label: 'REFUNDED' }
    case 'failed':
      return { tone: 'failed' as const, label: 'FAILED' }
    default:
      return { tone: 'neutral' as const, label: status.toUpperCase() }
  }
}

export function getInspectionStatusBadge(status: string) {
  switch (status) {
    case 'requested':
      return { tone: 'pending' as const, label: 'REQUESTED' }
    case 'confirmed':
      return { tone: 'confirmed' as const, label: 'CONFIRMED' }
    case 'lawyer-review':
      return { tone: 'lawyer-review' as const, label: 'LAWYER REVIEW' }
    case 'signed':
      return { tone: 'signed' as const, label: 'SIGNED' }
    case 'cancelled':
      return { tone: 'cancelled' as const, label: 'CANCELLED' }
    default:
      return { tone: 'neutral' as const, label: status.toUpperCase() }
  }
}

export function getPaymentTypeLabel(type: string) {
  switch (type) {
    case 'rent':
      return 'Rent + caution fee'
    case 'commission':
      return 'Platform commission'
    case 'legal':
      return 'Lawyer review'
    case 'caution':
      return 'Caution fee'
    case 'verification':
      return 'Identity verification'
    case 'inspection-deposit':
      return 'Inspection deposit'
    default:
      return type
  }
}
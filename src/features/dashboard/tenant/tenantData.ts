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
}

export const tenantInspections: Inspection[] = [
  {
    id: 'insp1',
    propertyId: 'd1',
    propertyTitle: '2-bedroom flat, newly serviced',
    propertyLocation: 'Sabo, Yaba',
    landlordName: 'Emeka Adeyemi',
    status: 'lawyer-review',
    requestedDate: '12 Aug',
    scheduledDate: '15 Aug',
    confirmedDate: '13 Aug',
    lawyerReviewDate: 'In progress',
  },
  {
    id: 'insp2',
    propertyId: 'd4',
    propertyTitle: '2-bedroom terrace',
    propertyLocation: 'Gbagada Phase 1',
    landlordName: 'Samuel Okafor',
    status: 'confirmed',
    requestedDate: '10 Aug',
    scheduledDate: '18 Aug',
    confirmedDate: '12 Aug',
  },
  {
    id: 'insp3',
    propertyId: 'd3',
    propertyTitle: 'Mini flat, serviced',
    propertyLocation: 'Surulere',
    landlordName: 'Bimbo Salami',
    status: 'requested',
    requestedDate: '20 Aug',
    scheduledDate: '25 Aug',
  },
]

export const tenantPayments = [
  {
    id: 'pay1',
    type: 'legal' as const,
    propertyId: 'd1',
    propertyTitle: '2-bedroom flat, newly serviced',
    propertyLocation: 'Sabo, Yaba',
    amount: 45000,
    status: 'paid' as const,
    date: '12 Aug 2026',
    description: 'Lawyer review — Sabo, Yaba',
  },
  {
    id: 'pay2',
    type: 'inspection-deposit' as const,
    propertyId: 'd4',
    propertyTitle: '2-bedroom terrace',
    propertyLocation: 'Gbagada',
    amount: 10000,
    status: 'refunded' as const,
    date: '10 Aug 2026',
    description: 'Inspection deposit — Gbagada',
  },
  {
    id: 'pay3',
    type: 'verification' as const,
    amount: 2500,
    status: 'paid' as const,
    date: '4 Aug 2026',
    description: 'Identity verification',
  },
  {
    id: 'pay4',
    type: 'rent' as const,
    propertyId: 'd1',
    propertyTitle: '2-bedroom flat, newly serviced',
    propertyLocation: 'Sabo, Yaba',
    amount: 1655000,
    status: 'awaiting' as const,
    date: 'Due 1 Sept 2026',
    description: 'Rent + caution fee — Sabo, Yaba',
  },
]

export const initialSavedProperties = [
  {
    id: 'd1',
    slug: '2-bedroom-flat-newly-serviced-sabo-yaba',
    location: 'Sabo, Yaba',
    title: '2-bedroom flat, newly serviced',
    price: 1400000,
    beds: 2,
    baths: 2,
    type: '2-bedroom',
    typeLabel: '2-bedroom',
    image: '/home1.jpg',
    verified: true,
    savedAt: '12 Aug 2026',
  },
  {
    id: 'd3',
    slug: 'mini-flat-serviced-surulere',
    location: 'Surulere',
    title: 'Mini flat, serviced',
    price: 850000,
    beds: 1,
    baths: 1,
    type: 'mini-flat',
    typeLabel: 'Mini flat',
    image: '/home3.jpg',
    verified: true,
    savedAt: '10 Aug 2026',
  },
  {
    id: 'd5',
    slug: 'studio-apartment-ikeja-gra',
    location: 'Ikeja GRA',
    title: 'Studio apartment',
    price: 1200000,
    beds: 1,
    baths: 1,
    type: 'self-contained',
    typeLabel: 'Self-contain',
    image: '/home5.jpg',
    verified: true,
    savedAt: '8 Aug 2026',
  },
]

export interface SavedProperty extends DashboardProperty {
  savedAt: string
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

export const tenantAgreements = [
  {
    id: 'agr1',
    propertyId: 'd1',
    propertyTitle: '2-bedroom flat, newly serviced',
    propertyLocation: 'Sabo, Yaba',
    term: '12 months from 1 Sept 2026',
    date: '12th day of August, 2026',
    status: 'lawyer-review' as const,
    lawyer: {
      name: 'Tolu Fashola',
      initials: 'TF',
      barNumber: 'SCULM #4471',
      reviewingSince: '12 Aug 2026',
    },
    totalAmount: 1655000,
clauses: [
      {
        number: 1,
        title: 'Parties',
        content: 'Between Emeka Adeyemi (the Landlord) and Adaeze Okonkwo (the Tenant), in respect of Flat 2B, 14 Herbert Macaulay Way, Sabo, Yaba, Lagos.',
        flagged: false,
        status: 'approved' as const,
      },
      {
        number: 2,
        title: 'Term and Rent',
        content: 'The tenancy runs for twelve (12) calendar months from 1 September 2026 at an annual rent of ₦1,400,000, payable in advance into the platform escrow account.',
        flagged: false,
        status: 'approved' as const,
      },
      {
        number: 3,
        title: 'Rent Review',
        content: 'The Landlord reserves the right to review the rent at any time during the term upon giving the Tenant fourteen (14) days written notice.',
        flagged: true,
        status: 'flagged' as const,
        note: 'A mid-term rent review with 14 days notice is not enforceable against a yearly tenant under the Lagos State Tenancy Law. I have proposed a review only at renewal, with 3 months notice.',
        proposedEdit: 'The Landlord may review the rent at renewal upon giving the Tenant three (3) months written notice.',
      },
      {
        number: 4,
        title: 'Caution Fee',
        content: 'The Tenant shall pay a caution fee of ₦140,000, which the Landlord may apply at his sole discretion towards any expense he considers necessary.',
        flagged: true,
        status: 'flagged' as const,
        note: '"SOLE discretion" gives the landlord an open claim on your caution fee. Proposed edit: deductions limited to documented damage, itemised within 21 days of you moving out.',
        proposedEdit: 'The Tenant shall pay a caution fee of ₦140,000, which the Landlord may apply towards documented damages or unpaid rent, itemised within 21 days of the Tenant moving out.',
      },
      {
        number: 5,
        title: 'Repairs',
        content: 'The Tenant shall keep the interior in good and tenantable repair, fair wear and tear excepted, and shall report structural defects to the Landlord within seven (7) days.',
        flagged: false,
        status: 'updated' as const,
        note: 'Standard and fair. Take dated photographs of every room on the day you move in.',
        proposedEdit: 'The Tenant shall keep the interior in good and tenantable repair, fair wear and tear excepted, and shall report structural defects to the Landlord within seven (7) days. The Tenant is advised to take dated photographs of every room on move-in day.',
      },
    ],
feedback: [
      {
        id: 'fb1',
        type: 'flagged' as const,
        clauseRef: 3,
        message: 'A mid-term rent review with 14 days notice is not enforceable against a yearly tenant under the Lagos State Tenancy Law. I have proposed a review only at renewal, with 3 months notice.',
        proposedEdit: 'The Landlord may review the rent at renewal upon giving the Tenant three (3) months written notice.',
      },
      {
        id: 'fb2',
        type: 'flagged' as const,
        clauseRef: 4,
        message: '"SOLE discretion" gives the landlord an open claim on your caution fee. Proposed edit: deductions limited to documented damage, itemised within 21 days of you moving out.',
        proposedEdit: 'The Tenant shall pay a caution fee of ₦140,000, which the Landlord may apply towards documented damages or unpaid rent, itemised within 21 days of the Tenant moving out.',
      },
      {
        id: 'fb3',
        type: 'note' as const,
        clauseRef: 5,
        message: 'Standard and fair. Take dated photographs of every room on the day you move in.',
      },
      {
        id: 'fb4',
        type: 'updated' as const,
        clauseRef: 5,
        message: 'Updated clause 5 to include advice about move-in photography.',
        proposedEdit: 'The Tenant shall keep the interior in good and tenantable repair, fair wear and tear excepted, and shall report structural defects to the Landlord within seven (7) days. The Tenant is advised to take dated photographs of every room on move-in day.',
      },
      {
        id: 'fb5',
        type: 'approved' as const,
        clauseRef: 1,
        message: 'Parties correctly identified. No issues.',
      },
      {
        id: 'fb6',
        type: 'approved' as const,
        clauseRef: 2,
        message: 'Term and rent are standard. No issues.',
      },
    ],
  },
]

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
export interface LedgerTypeTotal {
  type: number
  currency: string
  total: number
  count: number
}

export interface AdminDashboardMetrics {
  totalUsers: number
  totalLandlords: number
  totalTenants: number
  totalCaretakers: number
  totalLawyers: number
  pendingLawyers: number
  listingsCount: number
  pendingListings: number
  publishedListings: number
  leasesCount: number
  activeLeases: number
  escrowHeld: number
  totalTransactions: number
  transactionVolume: number
  ledgerTotals: LedgerTypeTotal[]
}

export interface TransactionPoint {
  date: string
  count: number
  volume: number
}

export const EMPTY_ADMIN_METRICS: AdminDashboardMetrics = {
  totalUsers: 0,
  totalLandlords: 0,
  totalTenants: 0,
  totalCaretakers: 0,
  totalLawyers: 0,
  pendingLawyers: 0,
  listingsCount: 0,
  pendingListings: 0,
  publishedListings: 0,
  leasesCount: 0,
  activeLeases: 0,
  escrowHeld: 0,
  totalTransactions: 0,
  transactionVolume: 0,
  ledgerTotals: [],
}

export type LawyerApprovalStatus = 'pending' | 'verified' | 'suspended' | 'rejected'

export interface AdminLawyerRecord {
  id: string
  name: string
  email: string
  barNumber: string
  status: LawyerApprovalStatus
  kycVerified: boolean
  submittedAt: string
}

export type AdminListingStatus = 'pending' | 'published' | 'unpublished' | 'closed'

export interface AdminListingRecord {
  id: string
  title: string
  location: string
  owner: string
  rent: number
  status: AdminListingStatus
  ownershipVerified: boolean
  submittedAt: string
}

export interface AdminFeeSettings {
  platformCommissionRate: number
  legalFeeRate: number
}

export const EMPTY_FEE_SETTINGS: AdminFeeSettings = {
  platformCommissionRate: 0,
  legalFeeRate: 0,
}

export const ADMIN_VERIFIED_LABEL = 'Platform Administrator'
import { apiGet, apiPost, apiPut, buildQuery } from './client'
import { ListingStatus, ListingRecord } from './listingApi'

export enum LawyerStatus {
  Pending = 0,
  Verified = 1,
  Suspended = 2,
  Rejected = 3,
}

export interface LawyerRecord {
  id: string
  name?: string
  email?: string
  barNumber?: string
  status?: LawyerStatus
  [key: string]: unknown
}

export interface FeeSettings {
  platformCommissionRate?: number
  legalFeeRate?: number
  [key: string]: unknown
}

export async function verifyLawyer(userId: string): Promise<void> {
  return apiPost(`/admin/users/${userId}/verify-lawyer`)
}

export async function suspendLawyer(userId: string): Promise<void> {
  return apiPost(`/admin/users/${userId}/suspend-lawyer`)
}

export async function rejectLawyer(userId: string): Promise<void> {
  return apiPost(`/admin/users/${userId}/reject-lawyer`)
}

export async function getAdminDashboard(): Promise<Record<string, unknown>> {
  return apiGet('/admin/dashboard')
}

export async function getAdminTransactionMetrics(params: {
  from?: string
  to?: string
  granularity?: number
} = {}): Promise<unknown[]> {
  return apiGet(`/admin/metrics/transactions${buildQuery(params)}`)
}

export async function getLawyers(params: {
  status?: LawyerStatus
  page?: number
  pageSize?: number
} = {}): Promise<LawyerRecord[]> {
  return apiGet(`/admin/lawyers${buildQuery(params)}`)
}

export async function getAdminListings(params: {
  status?: ListingStatus
  page?: number
  pageSize?: number
} = {}): Promise<ListingRecord[]> {
  return apiGet(`/admin/listings${buildQuery(params)}`)
}

export async function getFeeSettings(): Promise<FeeSettings> {
  return apiGet('/admin/settings/fees')
}

export async function updateFeeSettings(payload: {
  platformCommissionRate: number
  legalFeeRate: number
}): Promise<FeeSettings> {
  return apiPut('/admin/settings/fees', payload)
}
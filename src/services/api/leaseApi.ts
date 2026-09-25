import { apiGet, apiPost, buildQuery } from './client'
import { extractArray, mapLeaseRecord } from './mappers'

export interface CreateLeasePayload {
  listingId: string
}

export interface RequestInspectionPayload {
  preferredDate: string
  note?: string
}

export interface ConfirmInspectionPayload {
  scheduledDate?: string
  notes?: string
}

export interface SignAgreementPayload {
  signatureImage?: string
}

export interface LeaseRecord {
  id: string
  listingId?: string
  tenantId?: string
  landlordId?: string
  status?: string
  preferredInspectionDate?: string
  inspectionScheduledAt?: string
  certified?: boolean
  tenantSigned?: boolean
  landlordSigned?: boolean
  createdAt?: string
  [key: string]: unknown
}

export interface TransactionRecord {
  id: string
  amount?: number
  type?: string
  status?: string
  createdAt?: string
  [key: string]: unknown
}

export async function createLease(payload: CreateLeasePayload): Promise<LeaseRecord & { id: string }> {
  const record = (await apiPost<unknown>('/leases', payload)) as Partial<LeaseRecord> & { leaseId?: string }
  return { ...record, id: String(record.id ?? record.leaseId ?? '') }
}

export async function requestInspection(leaseId: string, payload: RequestInspectionPayload): Promise<void> {
  return apiPost(`/leases/${leaseId}/inspection`, payload)
}

export async function requestInspectionReschedule(leaseId: string, payload: RequestInspectionPayload): Promise<void> {
  return apiPost(`/leases/${leaseId}/inspection/reschedule`, payload)
}

export async function beginInspection(leaseId: string): Promise<void> {
  return apiPost(`/leases/${leaseId}/inspection/begin`)
}

export async function confirmInspection(leaseId: string, payload: ConfirmInspectionPayload = {}): Promise<void> {
  return apiPost(`/leases/${leaseId}/inspection/confirm`, payload)
}

export async function declineInspection(leaseId: string): Promise<void> {
  return apiPost(`/leases/${leaseId}/inspection/decline`)
}

export async function cancelInspection(leaseId: string): Promise<void> {
  return apiPost(`/leases/${leaseId}/inspection/cancel`)
}

export async function confirmInspectionReschedule(leaseId: string): Promise<void> {
  return apiPost(`/leases/${leaseId}/inspection/reschedule/confirm`)
}

export async function rejectInspectionReschedule(leaseId: string): Promise<void> {
  return apiPost(`/leases/${leaseId}/inspection/reschedule/reject`)
}

export async function moveToLegalReview(leaseId: string): Promise<void> {
  return apiPost(`/leases/${leaseId}/legal-review`)
}

export async function certifyLease(leaseId: string): Promise<void> {
  return apiPost(`/leases/${leaseId}/certify`)
}

export async function signLease(leaseId: string, payload: SignAgreementPayload = {}): Promise<void> {
  return apiPost(`/leases/${leaseId}/sign`, payload)
}

export async function fundEscrow(leaseId: string): Promise<{ checkoutUrl?: string; url?: string; reference?: string }> {
  return apiPost(`/leases/${leaseId}/escrow/fund`)
}

export async function releaseEscrow(leaseId: string): Promise<void> {
  return apiPost(`/leases/${leaseId}/escrow/release`)
}

export async function getLease(leaseId: string): Promise<LeaseRecord> {
  return apiGet(`/leases/${leaseId}`)
}

export async function getLeaseAgreement(leaseId: string): Promise<LeaseRecord> {
  return apiGet(`/leases/${leaseId}/agreement`)
}

export async function getLeaseAgreementPdf(leaseId: string): Promise<Blob> {
  return apiGet(`/leases/${leaseId}/agreement/pdf`)
}

export async function getLeaseTransactions(leaseId: string, page = 1, pageSize = 20): Promise<TransactionRecord[]> {
  return apiGet(`/leases/${leaseId}/transactions${buildQuery({ page, pageSize })}`)
}

export async function listCallerLeases(page = 1, pageSize = 20): Promise<LeaseRecord[]> {
  const payload = await apiGet<unknown>(`/leases${buildQuery({ page, pageSize })}`)
  return extractArray(payload)
    .map(mapLeaseRecord)
    .filter((lease) => lease.id)
}
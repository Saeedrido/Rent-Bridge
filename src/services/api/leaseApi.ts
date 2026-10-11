import { apiGet, apiPost, buildQuery, refreshAccessToken, ApiError, errorFromBody } from './client'
import { extractArray, mapLeaseRecord } from './mappers'
import { API_BASE_URL, API_PREFIX } from './config'
import { getAccessToken } from './tokens'

export interface CreateLeasePayload {
  listingId: string
}

export interface RequestInspectionPayload {
  preferredDate: string
  note?: string
}

export interface ConfirmInspectionPayload {
  /** Required — a confirmation without a booking date is rejected server-side. */
  scheduledDate: string
  notes?: string
}

export interface CompleteInspectionPayload {
  /** When the inspection actually happened. Cannot be in the future. */
  actualDate: string
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

export async function confirmInspection(leaseId: string, payload: ConfirmInspectionPayload): Promise<void> {
  return apiPost(`/leases/${leaseId}/inspection/confirm`, payload)
}

/** Records that the inspection physically took place — this releases the escrow gate. */
export async function completeInspection(leaseId: string, payload: CompleteInspectionPayload): Promise<void> {
  return apiPost(`/leases/${leaseId}/inspection/complete`, payload)
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

/**
 * Document-based signing flow.
 *
 * Documents are hosted first via POST /uploads (returns an HTTPS URL) and the
 * URL is then attached to the lease. There is no multipart upload here.
 */
export interface AgreementDocumentPayload {
  url: string
  fileName?: string
}

/** The assigned lawyer attaches the agreement document for the landlord to sign. */
export async function uploadAgreementDocument(leaseId: string, payload: AgreementDocumentPayload): Promise<void> {
  return apiPost(`/leases/${leaseId}/agreement/document`, payload)
}

/**
 * A party opens their copy. Records the download server-side and returns a
 * short-lived signed URL. The landlord gets the lawyer's source document; the
 * tenant gets the landlord-signed document.
 */
export async function downloadAgreementDocument(leaseId: string): Promise<string> {
  const res = await apiPost<{ url?: string }>(`/leases/${leaseId}/agreement/document/download`)
  return String(res?.url ?? '')
}

/** A party attaches their signed copy of the agreement. */
export async function uploadSignedAgreementDocument(leaseId: string, payload: AgreementDocumentPayload): Promise<void> {
  return apiPost(`/leases/${leaseId}/agreement/document/sign`, payload)
}

interface AgreementDocumentBlob {
  blob: Blob
  fileName?: string
}

function contentDispositionFileName(header: string | null): string | undefined {
  if (!header) return undefined
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1])
    } catch {
      return utf8[1]
    }
  }
  const ascii = /filename="?([^";]+)"?/i.exec(header)
  return ascii ? ascii[1] : undefined
}

/**
 * Streams the agreement bytes through our API so the disposition can be set
 * server-side. Cloudinary serves raw files as attachments regardless of the
 * link, so the browser cannot render them inline from the storage URL; proxying
 * lets us view a PDF in the tab and honour a real download when asked.
 */
async function fetchAgreementDocumentBlob(leaseId: string, download: boolean): Promise<AgreementDocumentBlob> {
  const url = `${API_BASE_URL}${API_PREFIX}/leases/${leaseId}/agreement/document/content${
    download ? '?download=true' : ''
  }`
  let token = getAccessToken()
  let response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  if (response.status === 401) {
    token = await refreshAccessToken()
    if (token) {
      response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    }
  }

  if (!response.ok) {
    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      /* not JSON */
    }
    throw new ApiError(errorFromBody(body, `Could not load the agreement (${response.status})`), response.status)
  }

  const blob = await response.blob()
  return { blob, fileName: contentDispositionFileName(response.headers.get('content-disposition')) }
}

/** Opens the agreement inline in a new tab so it renders instead of downloading. */
export async function viewAgreementDocument(leaseId: string): Promise<void> {
  const { blob } = await fetchAgreementDocumentBlob(leaseId, false)
  const objectUrl = URL.createObjectURL(blob)
  window.open(objectUrl, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}

/** Downloads the agreement as an attachment, preserving the original file name. */
export async function downloadAgreementDocumentFile(leaseId: string, fallbackName = 'agreement.pdf'): Promise<void> {
  const { blob, fileName } = await fetchAgreementDocumentBlob(leaseId, true)
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName || fallbackName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}

/** A party sends their signed copy to the assigned lawyer for review. */
export async function submitAgreementDocumentForReview(leaseId: string): Promise<void> {
  return apiPost(`/leases/${leaseId}/agreement/document/submit`)
}

/** The assigned lawyer approves a party's submitted signed document. */
export async function approveAgreementDocument(leaseId: string, party: 'Landlord' | 'Tenant'): Promise<void> {
  return apiPost(`/leases/${leaseId}/agreement/document/approve`, { party })
}

export interface FundEscrowResponse {
  checkoutUrl?: string
  url?: string
  reference?: string
  status?: string
  totalAmount?: number
  currency?: string
}

export async function fundEscrow(leaseId: string): Promise<FundEscrowResponse> {
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
import { apiGet, apiPost, apiDelete, buildQuery } from './client'
import { extractArray } from './mappers'

export interface CreatePropertyPayload {
  street?: string
  city?: string
  area?: string
  state?: string
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  availableFrom?: string
  amenities?: string[]
  documentUrls?: string[]
  imageUrls?: string[]
}

export interface PropertyRecord {
  id: string
  street?: string
  city?: string
  area?: string
  state?: string
  documentUrls?: string[]
  verified?: boolean
  isVerified?: boolean
  createdAt?: string
  // Add documents field to get the uploaded images
  documents?: Array<{
    id: string
    status: string
    fileKey: string
  }>
  // Property images (photos of the house)
  Images?: string[]
  images?: string[]
  [key: string]: unknown
}

export type DocumentReviewStatus = 'Uploaded' | 'UnderReview' | 'Verified' | 'Rejected' | string

export interface OwnershipDocumentReview {
  documentId: string
  fileKey: string
  status: DocumentReviewStatus
  verifiedByName?: string | null
  verifiedByRole?: string | null
  rejectionReason?: string | null
  uploadedAt: string
  reviewedAt?: string | null
}

export interface PropertyReviewItem {
  propertyId: string
  street: string
  city: string
  area: string
  state: string
  propertyType?: string | null
  bedrooms: number
  bathrooms: number
  isVerified: boolean
  verifiedByUserId?: string | null
  verifiedByName?: string | null
  verifiedByRole?: string | null
  assignedLawyerId?: string | null
  assignedLawyerName?: string | null
  ownerUserId: string
  ownerName: string
  documents: OwnershipDocumentReview[]
}

export async function createProperty(payload: CreatePropertyPayload): Promise<PropertyRecord & { id: string }> {
  const record = (await apiPost<unknown>('/properties', payload)) as Partial<PropertyRecord> & { propertyId?: string }
  return { ...record, id: String(record.id ?? record.propertyId ?? '') }
}

export async function getMyProperties(params: {
  Page?: number
  PageSize?: number
  IsVerified?: boolean
  State?: string
  City?: string
} = {}): Promise<PropertyRecord[]> {
  const payload = await apiGet<unknown>(`/properties/mine${buildQuery(params)}`)
  console.log('[PROPERTY DEBUG] getMyProperties raw payload:', JSON.stringify(payload, null, 2))
  const result = extractArray(payload) as PropertyRecord[]
  console.log('[PROPERTY DEBUG] getMyProperties extracted:', JSON.stringify(result, null, 2))
  return result
}

export async function getPropertyReviews(): Promise<PropertyReviewItem[]> {
  const payload = await apiGet<unknown>('/properties/reviews')
  return extractArray(payload) as PropertyReviewItem[]
}

export async function verifyProperty(propertyId: string): Promise<void> {
  return apiPost(`/properties/${propertyId}/verify`)
}

export async function startDocumentReview(propertyId: string, documentId: string): Promise<void> {
  return apiPost(`/properties/${propertyId}/documents/${documentId}/start-review`)
}

export async function verifyDocument(propertyId: string, documentId: string): Promise<void> {
  return apiPost(`/properties/${propertyId}/documents/${documentId}/verify`)
}

export async function rejectDocument(propertyId: string, documentId: string, reason?: string): Promise<void> {
  return apiPost(`/properties/${propertyId}/documents/${documentId}/reject${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`)
}

export async function submitPropertyForReview(propertyId: string): Promise<void> {
  return apiPost(`/properties/${propertyId}/submit-for-review`)
}

export async function deleteProperty(propertyId: string): Promise<void> {
  return apiDelete(`/properties/${propertyId}`)
}
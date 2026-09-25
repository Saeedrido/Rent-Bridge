import { apiGet, apiPatch, apiPost, buildQuery } from './client'
import { extractArray } from './mappers'

export enum ListingStatus {
  Draft = 0,
  Published = 1,
  Unpublished = 2,
  Closed = 3,
}

export type ListingTypeValue = 'rent' | 'sale'
export type PaymentPlanValue = 'outright' | 'installment'

export interface CreateListingPayload {
  propertyId: string
  title?: string
  priceAmount: number
  description?: string
  listingType?: ListingTypeValue
  paymentPlan?: PaymentPlanValue
  cautionFeeAmount?: number | null
  otherExpenses?: string
  realHouseFeeAmount?: number | null
  agentFeeAmount?: number | null
  imageUrls?: string[]
}

export interface EditListingPayload {
  title?: string
  description?: string
  priceAmount?: number
}

export interface ListingRecord {
  id: string
  title?: string
  description?: string
  priceAmount?: number
  status?: ListingStatus | number
  propertyId?: string
  ownerId?: string
  city?: string
  state?: string
  area?: string
  createdAt?: string
  [key: string]: unknown
}

export interface ListingDetail extends ListingRecord {
  currency?: string
  coverImageKey?: string | null
  imageUrls?: string[]
  publishedAt?: string
  listingType?: ListingTypeValue | number
  paymentPlan?: PaymentPlanValue | number
  cautionFeeAmount?: number | null
  realHouseFeeAmount?: number | null
  agentFeeAmount?: number | null
  street?: string
  city?: string
  area?: string
  state?: string
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  availableFrom?: string
  amenities?: string[]
  ownerUserId?: string
  ownerName?: string
  ownerEmail?: string
  ownerVerified?: boolean
}

export async function createListing(payload: CreateListingPayload): Promise<ListingRecord & { id: string }> {
  const record = (await apiPost<unknown>('/listings', payload)) as Partial<ListingRecord> & { listingId?: string }
  return { ...record, id: String(record.id ?? record.listingId ?? '') }
}

export async function publishListing(listingId: string): Promise<void> {
  return apiPost(`/listings/${listingId}/publish`)
}

export async function unpublishListing(listingId: string): Promise<void> {
  return apiPost(`/listings/${listingId}/unpublish`)
}

export async function closeListing(listingId: string): Promise<void> {
  return apiPost(`/listings/${listingId}/close`)
}

export async function editListing(listingId: string, payload: EditListingPayload): Promise<ListingRecord> {
  return apiPatch(`/listings/${listingId}`, payload)
}

export async function searchListings(params: {
  Page?: number
  PageSize?: number
  State?: string
  City?: string
  Area?: string
  MinPrice?: number
  MaxPrice?: number
  Status?: ListingStatus | number
  Mine?: boolean
} = {}): Promise<ListingRecord[]> {
  const payload = await apiGet<unknown>(`/listings/search${buildQuery(params)}`)
  return extractArray(payload) as ListingRecord[]
}

export async function getListing(listingId: string): Promise<ListingDetail> {
  return apiGet<ListingDetail>(`/listings/${listingId}`)
}
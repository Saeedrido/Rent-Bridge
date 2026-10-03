import type { Property, PropertyImage } from '@/features/properties/types/property'
import type { DashboardProperty } from '@/features/dashboard/data/dashboardProperties'
import type { InspectionRequest, AgreementRecord, PaymentRecord } from '@/features/dashboard/roleDashboards/data'
import type { Inspection, Payment, TenantAgreement, AgreementClause } from '@/features/dashboard/tenant/tenantData'
import type { SavedProperty } from '@/features/dashboard/tenant/tenantData'
import type { LeaseRecord } from './leaseApi'
import type { AgreementFeedback } from '@/features/dashboard/tenant/tenantData'
import type {
  AdminDashboardMetrics,
  AdminLawyerRecord,
  AdminListingRecord,
  AdminListingStatus,
  AdminFeeSettings,
  LawyerApprovalStatus,
  TransactionPoint,
} from '@/features/dashboard/roleDashboards/adminData'

type Row = Record<string, unknown>

const COVERS = ['/home1.jpg', '/home2.jpg', '/home3.jpg', '/home4.jpg', '/home5.jpg', '/home6.jpg']

export function asRow(value: unknown): Row {
  return value && typeof value === 'object' ? (value as Row) : {}
}

function text(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function optionalText(value: unknown): string | undefined {
  const v = text(value)
  return v ? v : undefined
}

function numberValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function optionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = numberValue(value)
  return Number.isFinite(parsed) && value !== '' ? parsed : undefined
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function listingSlug(id: string, title: string): string {
  const base = slugify(title) || 'listing'
  return `${base}-${id.slice(0, 8)}`
}

function resolveCoverImage(key: unknown, id: string): string {
  const raw = text(key)
  if (!raw) return COVERS[Math.abs(hashString(id)) % COVERS.length]
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) return raw
  return COVERS[Math.abs(hashString(raw)) % COVERS.length]
}

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function readPrice(item: Row): number {
  const direct = optionalNumber(item.priceAmount)
  if (direct !== undefined) return direct
  const price = asRow(item.price)
  const nested = optionalNumber(price.amount)
  if (nested !== undefined) return nested
  const legacy = optionalNumber(item.price)
  if (legacy !== undefined) return legacy
  const rent = asRow(item.rentAmount)
  const rentValue = optionalNumber(rent.amount)
  return rentValue ?? 0
}

function readAddressParts(item: Row): { street: string; area: string; city: string; state: string } {
  const address = asRow(item.address ?? item.propertyAddress)
  return {
    street: text(item.street || address.street),
    area: text(item.area || address.area),
    city: text(item.city || address.city),
    state: text(item.state || address.state),
  }
}

function readLocationLabel(item: Row): string {
  const { street, area, city } = readAddressParts(item)
  const head = [area, street].filter(Boolean).join(', ')
  if (head) return head
  return city || 'Nigeria'
}

function readImages(item: Row, id: string): PropertyImage[] {
  console.log('[IMAGE DEBUG] Raw item keys:', Object.keys(item))
  console.log('[IMAGE DEBUG] coverImageKey:', item.coverImageKey, 'CoverImageKey:', item.CoverImageKey)
  console.log('[IMAGE DEBUG] imageUrls:', item.imageUrls, 'ImageUrls:', item.ImageUrls)
  console.log('[IMAGE DEBUG] images:', item.images, 'Images:', item.Images)
  
  const cover = resolveCoverImage(item.coverImageKey ?? item.CoverImageKey ?? item.coverImage ?? item.image, id)
  const rawImages = arrayValue(item.images ?? item.Images)
  const imageUrls = arrayValue(item.imageUrls ?? item.ImageUrls).map(text).filter(Boolean)
  
  console.log('[IMAGE DEBUG] Resolved cover:', cover)
  console.log('[IMAGE DEBUG] rawImages:', rawImages)
  console.log('[IMAGE DEBUG] imageUrls:', imageUrls)
  const images = rawImages
    .map((entry, index) => {
      const row = asRow(entry)
      const url = text(row.url || row.imageUrl || row)
      if (!url) return null
      return {
        id: text(row.id) || `${id}-${index}`,
        url,
        alt: text(row.alt) || text(row.altText) || text(item.title) || 'Property image',
      } satisfies PropertyImage
    })
    .filter((entry): entry is PropertyImage => entry !== null)
  imageUrls.forEach((url, index) => {
    images.push({ id: `${id}-upload-${index}`, url, alt: text(item.title) || 'Property image' })
  })
  if (images.length > 0) return images
  return [{ id: `${id}-cover`, url: cover, alt: text(item.title) || 'Property image' }]
}

function readBeds(item: Row): number {
  const beds = optionalNumber(item.bedrooms ?? item.beds)
  return beds ?? 0
}

function readBaths(item: Row): number {
  const baths = optionalNumber(item.bathrooms ?? item.baths)
  return baths ?? 0
}

function readAmenities(item: Row): string[] {
  return arrayValue(item.amenities)
    .map((entry) => text(entry))
    .filter(Boolean)
}

function readLandlord(item: Row): Property['landlord'] {
  const landlord = asRow(item.landlord ?? item.owner)
  const id = text(landlord.id ?? item.ownerUserId ?? item.ownerId)
  const name = text(landlord.name ?? item.ownerName) || 'Rent Bridge listing'
  return {
    id,
    name,
    role: text(landlord.role) || (item.ownerVerified === undefined ? 'Verified host' : item.ownerVerified ? 'Verified host' : 'Host'),
    verified: landlord.verified === undefined ? Boolean(item.ownerVerified ?? true) : Boolean(landlord.verified),
    phone: optionalText(landlord.phone),
    rating: optionalNumber(landlord.rating),
  }
}

export function listingToProperty(raw: unknown): Property {
  const item = asRow(raw)
  const id = text(item.id) || text(item.listingId) || text(item.propertyId) || `p-${hashString(JSON.stringify(item))}`
  const title = text(item.title) || 'Listed property'
  const { city, state } = readAddressParts(item)
  const images = readImages(item, id)
  const propertyTypeRaw = text(item.propertyType) || text(item.type)
  const propertyType = (['flat', 'apartment', 'house', 'mini-flat', 'duplex', 'studio'].includes(propertyTypeRaw)
    ? propertyTypeRaw
    : 'flat') as Property['propertyType']
  const status = numberValue(item.status)
  const createdAt = text(item.publishedAt || item.createdAt)
  return {
    id,
    slug: text(item.slug) || listingSlug(id, title),
    title,
    listingType:
      item.listingType === 'sale' || item.listingType === 1 ? 'sale' : 'rent',
    propertyType,
    location: readLocationLabel(item),
    city: city || 'Lagos',
    state: state || 'Lagos',
    price: readPrice(item),
    beds: readBeds(item),
    baths: readBaths(item),
    area: optionalNumber(item.areaSqm ?? item.areaSize),
    verified:
      item.ownerVerified !== undefined
        ? Boolean(item.ownerVerified)
        : item.verified === undefined
          ? status === 1
          : Boolean(item.verified),
    description: text(item.description) || 'Contact the listing owner for more details.',
    amenities: readAmenities(item),
    images,
    coverImage: images[0].url,
    landlord: readLandlord(item),
    coordinates: readCoordinates(item),
    featured: item.featured === true,
    createdAt,
  }
}

function readCoordinates(item: Row): { lat: number; lng: number } | undefined {
  const coordinates = asRow(item.coordinates)
  const lat = optionalNumber(coordinates.lat ?? item.lat)
  const lng = optionalNumber(coordinates.lng ?? item.lng)
  if (lat !== undefined && lng !== undefined) return { lat, lng }
  return undefined
}

export function listingToDashboardProperty(raw: unknown): DashboardProperty {
  const item = asRow(raw)
  const property = listingToProperty(item)
  const typeLabel = text(item.typeLabel) || text(item.propertyType) || property.propertyType
  return {
    id: property.id,
    slug: property.slug,
    location: property.location,
    title: property.title,
    price: property.price,
    beds: property.beds,
    baths: property.baths,
    type: text(item.propertyType) || property.propertyType,
    typeLabel,
    image: property.coverImage,
    verified: property.verified,
  }
}

export function formatDate(value: unknown): string {
  const raw = text(value)
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatShortDate(value: unknown): string {
  const raw = text(value)
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function mapPaymentType(raw: unknown): Payment['type'] {
  const value = text(raw).toLowerCase()
  if (value.includes('inspect')) return 'inspection-deposit'
  if (value.includes('verif') || value.includes('kyc')) return 'verification'
  if (value.includes('legal') || value.includes('lawyer')) return 'legal'
  if (value.includes('commission') || value.includes('platform') || value.includes('fee')) return 'commission'
  if (value.includes('caution')) return 'caution'
  return 'rent'
}

function mapPaymentStatus(raw: unknown): Payment['status'] {
  const value = text(raw).toLowerCase()
  if (!value) return 'pending'
  if (value.includes('refund')) return 'refunded'
  if (value.includes('fail') || value.includes('revert')) return 'failed'
  if (value.includes('success') || value.includes('settled') || value.includes('paid') || value.includes('complete')) return 'paid'
  if (value.includes('await') || value.includes('escrow') || value.includes('fund')) return 'awaiting'
  return 'pending'
}

export function transactionToPayment(raw: unknown): Payment {
  const item = asRow(raw)
  const lease = asRow(item.lease ?? item.leaseSummary)
  const listing = asRow(item.listing ?? item.listingSummary)
  const propertyTitle = text(item.propertyTitle || listing.title || lease.listingTitle)
  const propertyLocation = text(item.propertyLocation || listing.area || listing.city)
  const amount = readPrice(item)
  const description = text(item.description || item.type || item.kind || item.reference) || 'Escrow transaction'
  return {
    id: text(item.id) || text(item.transactionId) || `tx-${hashString(JSON.stringify(item))}`,
    type: mapPaymentType(item.type ?? item.kind ?? description),
    propertyId: optionalText(lease.listingId ?? item.listingId),
    propertyTitle: propertyTitle || undefined,
    propertyLocation: propertyLocation || undefined,
    amount,
    status: mapPaymentStatus(item.status ?? item.state),
    date: formatDate(item.createdAt ?? item.occurredAt),
    description,
  }
}

function leaseStatus(item: Row): string {
  return text(item.status ?? item.state)
}

export function mapLeaseToInspectionStatus(status: string): Inspection['status'] {
  const value = status.toLowerCase()
  if (value.includes('cancel') || value.includes('declin')) return 'cancelled'
  if (value.includes('fully') || value.includes('partial') || value.includes('certified')) return 'signed'
  if (value.includes('legal')) return 'lawyer-review'
  if (value.includes('confirm')) return 'confirmed'
  return 'requested'
}

export function leaseToInspection(raw: unknown): Inspection {
  const item = asRow(raw)
  const listing = asRow(item.listing ?? item.listingSummary)
  const property = asRow(item.property)
  const address = asRow(item.address ?? property.address)
  const inspection = asRow(item.inspection)
  const status = leaseStatus(item)
  const landlord = asRow(item.landlord)
  return {
    id: text(item.id) || text(item.leaseId),
    propertyId: text(item.listingId ?? listing.id ?? property.id),
    propertyTitle: text(item.listingTitle ?? listing.title ?? property.title) || 'Tenancy lease',
    propertyLocation: [text(item.area ?? address.area), text(item.city ?? address.city)].filter(Boolean).join(', '),
    landlordName: text(landlord.name ?? item.landlordName) || 'Landlord',
    status: mapLeaseToInspectionStatus(status),
    requestedDate: formatShortDate(item.preferredInspectionDate ?? inspection.preferredDate ?? item.createdAt),
    scheduledDate: formatShortDate(item.inspectionScheduledAt ?? inspection.scheduledDate) || undefined,
    confirmedDate: formatShortDate(inspection.confirmedAt) || undefined,
    lawyerReviewDate: status.toLowerCase().includes('legal') ? 'In progress' : undefined,
    signedDate: formatShortDate(item.signedAt) || undefined,
    cancelledDate: status.toLowerCase().includes('cancel') ? formatShortDate(item.updatedAt) || 'Cancelled' : undefined,
  }
}

function mapAgreementStatusForLease(status: string): AgreementRecord['status'] {
  const value = status.toLowerCase()
  if (value.includes('fully')) return 'signed'
  if (value.includes('partial')) return 'partially-signed'
  // 'Certified' means the lawyer approved it and it is WAITING for signatures.
  // Mapping it to 'signed' showed a completed contract before anyone signed.
  if (value.includes('certified')) return 'certified'
  if (value.includes('legal')) return 'with-lawyer'
  return 'draft'
}

export function leaseToAgreementRecord(raw: unknown): AgreementRecord {
  const item = asRow(raw)
  const listing = asRow(item.listing ?? item.listingSummary)
  const property = asRow(item.property)
  const lawyer = asRow(item.lawyer ?? item.assignedLawyer)
  const tenant = asRow(item.tenant)
  const status = leaseStatus(item)
  const title = text(item.listingTitle ?? listing.title ?? property.title) || 'Tenancy agreement'
  const address = asRow(item.address ?? property.address)
  const location = [text(item.area ?? address.area), text(item.city ?? address.city)].filter(Boolean).join(', ')
  return {
    id: text(item.id) || text(item.leaseId),
    propertyTitle: location ? `${title} — ${location}` : title,
    tenant: text(tenant.name ?? item.tenantName) || 'Tenant',
    lawyer: text(lawyer.name ?? item.lawyerName) || (status.toLowerCase().includes('legal') ? 'Awaiting assignment' : 'Not assigned'),
    status: mapAgreementStatusForLease(status),
    signedParties: Array.isArray(item.signedParties)
      ? item.signedParties.map((p: unknown) => text(p))
      : [],
    updated: formatShortDate(item.updatedAt ?? item.createdAt) || 'Updated today',
  }
}

export function leaseToTenantAgreement(raw: unknown, clauses: TenantAgreement['clauses'] = []): TenantAgreement {
  const item = asRow(raw)
  const listing = asRow(item.listing ?? item.listingSummary)
  const property = asRow(item.property)
  const address = asRow(item.address ?? property.address)
  const lawyer = asRow(item.lawyer ?? item.assignedLawyer)
  const tenant = asRow(item.tenant)
  const status = leaseStatus(item).toLowerCase()
  // Once money is in escrow the lease status becomes FundedInEscrow/Releasing/
  // Released, none of which contain 'fully' — without this the agreement page fell
  // through to 'draft' and claimed a paid agreement was still being prepared.
  const escrowFunded = /funded|releasing|released/.test(status)
  const title = text(item.listingTitle ?? listing.title ?? property.title) || 'Tenancy agreement'
  const location = [text(item.area ?? address.area), text(item.city ?? address.city)].filter(Boolean).join(', ')
  const mapped: TenantAgreement['status'] = escrowFunded || status.includes('fully')
    ? 'signed'
    : status.includes('certified') ||
        status.includes('partial') ||
        status.includes('awaitingsign')
      ? 'awaiting-tenant'
      : status.includes('legal')
        ? 'lawyer-review'
        : 'draft'
  // GET /leases/{id} nests signatures under `agreement` (LeaseDetailResponse), so
  // reading only the top level returned [] on a fully signed lease and the page
  // tried to sign again. Accept either shape.
  const agreement = asRow(item.agreement ?? item.agreementDetail)
  // Party names come back PascalCased from the API ('Landlord'/'Tenant'), but match
  // case-insensitively so a casing change cannot silently disable the pay gate.
  const signedParties = arrayValue(agreement.signatures ?? item.signatures)
    .map((entry) => text(asRow(entry).party))
    .filter(Boolean)
  const lawyerName = text(lawyer.name ?? item.lawyerName)
  const feedback = clauses
    .filter((clause) => Boolean(clause.note))
    .map((clause) => ({
      id: `fb-${clause.number}`,
      type: (clause.status === 'approved'
        ? 'approved'
        : clause.status === 'updated'
          ? 'updated'
          : 'flagged') as AgreementFeedback['type'],
      clauseRef: clause.number,
      message: clause.note as string,
      proposedEdit: clause.proposedEdit,
    }))
  return {
    id: text(item.id) || text(item.leaseId),
    propertyId: text(item.listingId ?? listing.id ?? property.id),
    propertyTitle: title,
    propertyLocation: location,
    term: text(item.term) || 'Fixed tenancy term',
    date: formatDate(item.createdAt),
    status: mapped,
    signedParties,
    escrowFunded,
    lawyer: {
      name: lawyerName || 'Awaiting assignment',
      initials: lawyerName
        ? lawyerName
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : '—',
      barNumber: text(lawyer.barNumber) || '—',
      reviewingSince: formatShortDate(item.legalReviewStartedAt ?? item.updatedAt) || '—',
    },
    clauses,
    feedback,
    totalAmount: readPrice(item),
    tenantName: text(tenant.name ?? item.tenantName) || undefined,
  } as TenantAgreement
}

export function agreementPayloadToClauses(payload: unknown): AgreementClause[] {
  const rows = extractArray(payload, 'clauses', 'terms')
  return rows
    .map((row, index): AgreementClause | null => {
      const item = asRow(row)
      const content = text(item.content ?? item.text ?? item.body)
      if (!content) return null
      const statusRaw = text(item.status).toLowerCase()
      const flagged = item.flagged === true || statusRaw.includes('flag') || Boolean(item.note)
      const status: AgreementClause['status'] = statusRaw.includes('approv')
        ? 'approved'
        : statusRaw.includes('updat')
          ? 'updated'
          : flagged
            ? 'flagged'
            : 'pending'
      return {
        number: optionalNumber(item.number) ?? index + 1,
        title: text(item.title ?? item.heading) || `Clause ${optionalNumber(item.number) ?? index + 1}`,
        content,
        flagged,
        status,
        note: optionalText(item.note ?? item.comment ?? item.lawyerNote),
        proposedEdit: optionalText(item.proposedEdit ?? item.proposed ?? item.suggestedEdit),
      }
    })
    .filter((clause): clause is AgreementClause => clause !== null)
}

export function agreementTermsToClauses(payload: unknown): AgreementClause[] {
  const envelope = asRow(payload)
  const terms = asRow(envelope.terms ?? payload)
  const tenant = asRow(terms.tenant)
  const landlord = asRow(terms.landlord)
  const lawyer = asRow(terms.lawyer)
  const property = asRow(terms.property)
  const rent = asRow(terms.rent)
  const naira = (amount: number): string => `₦${amount.toLocaleString('en-NG')}`
  const rentLabel = `${naira(numberValue(rent.amount))} ${text(rent.currency) || 'NGN'}`
  const clauseContent: { title: string; content: string }[] = []

  const tenantName = text(tenant.name) || 'the Tenant'
  const landlordName = text(landlord.name) || 'the Landlord'
  const parties = `Between ${landlordName} (the Landlord${text(landlord.email) ? `, ${text(landlord.email)}` : ''}) and ${tenantName} (the Tenant${text(tenant.email) ? `, ${text(tenant.email)}` : ''}).`
  if (parties) clauseContent.push({ title: 'Parties', content: parties })

  const address = text(property.address)
  const propertyDesc = [text(property.title), address].filter(Boolean).join(' — ')
  if (propertyDesc) {
    const description = optionalText(property.description)
    clauseContent.push({
      title: 'Property',
      content: description ? `${propertyDesc}. ${description}` : propertyDesc,
    })
  }
  if (rentLabel) {
    const scheduled = optionalText(terms.inspectionScheduledDate)
    clauseContent.push({
      title: 'Term & Rent',
      content:
        `The annual rent is ${rentLabel}, payable in advance into the platform escrow account.` +
        (scheduled ? ` The inspection is scheduled for ${formatDate(scheduled)}.` : ''),
    })
  }

  return clauseContent.map((clause, index) => ({
    number: index + 1,
    title: clause.title,
    content: clause.content,
    flagged: false,
    status: 'pending' as const,
    note: text(lawyer.name) ? `Assigned lawyer: ${text(lawyer.name)}` : undefined,
  }))
}

export function leaseToSavedProperty(raw: unknown): SavedProperty {
  const dashboard = listingToDashboardProperty(raw)
  return {
    ...dashboard,
    savedAt: formatDate(asRow(raw).createdAt) || 'Saved today',
  }
}

export function mapLeaseRecord(raw: unknown): LeaseRecord {
  const item = asRow(raw)
  return {
    ...item,
    id: text(item.id) || text(item.leaseId),
    listingId: optionalText(item.listingId),
    tenantId: optionalText(item.tenantId),
    landlordId: optionalText(item.landlordId),
    status: optionalText(item.status ?? item.state),
    createdAt: optionalText(item.createdAt),
  } as LeaseRecord
}

export function pickLeaseIds(raw: unknown): string[] {
  const rows = arrayValue(raw)
  const ids = new Set<string>()
  for (const row of rows) {
    const item = asRow(row)
    const lease = asRow(item.lease)
    const id = text(item.leaseId ?? lease.id)
    if (id) ids.add(id)
  }
  return [...ids]
}

export function extractArray(payload: unknown, ...keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload
  const row = asRow(payload)
  for (const key of ['items', 'data', 'results', 'rows', 'list', ...keys]) {
    const value = row[key]
    if (Array.isArray(value)) return value
  }
  return []
}

const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

export function propertyToDashboardProperty(property: Property): DashboardProperty {
  return {
    id: property.id,
    slug: property.slug,
    location: property.location,
    title: property.title,
    price: property.price,
    beds: property.beds,
    baths: property.baths,
    type: property.propertyType,
    typeLabel: property.propertyType.replace(/-/g, ' '),
    image: property.coverImage,
    verified: property.verified,
  }
}

export function leaseToInspectionRequest(raw: unknown): InspectionRequest | null {
  const item = asRow(raw)
  const listing = asRow(item.listing ?? item.listingSummary)
  const tenant = asRow(item.tenant)
  const inspection = asRow(item.inspection)

  // Status must come from the inspection REQUEST, never the lease status.
  // A lease in "InspectionRequested" with no request row is not something a
  // landlord can accept, and every post-inspection lease status (LegalReview,
  // Certified, FundedInEscrow, Released...) would otherwise render as pending.
  const inspectionStatus = text(inspection.status).toLowerCase()
  if (!inspectionStatus) return null

  const scheduled = text(inspection.scheduledDate ?? item.inspectionScheduledAt)
  const actual = text(inspection.actualDate)
  const preferred = text(inspection.preferredDate ?? item.preferredInspectionDate)
  const slot = actual
    ? `${formatShortDate(actual)} · completed`
    : scheduled
      ? `${formatShortDate(scheduled)} · scheduled`
      : preferred
        ? `${formatShortDate(preferred)} · requested`
        : 'Awaiting schedule'

  // 'completed' stays distinct from 'confirmed': only a completed inspection
  // has satisfied the escrow release gate, and the UI offers a different
  // action for each.
  const status: InspectionRequest['status'] =
    inspectionStatus === 'completed'
      ? 'completed'
      : inspectionStatus === 'confirmed'
        ? 'confirmed'
        : inspectionStatus === 'pending' || inspectionStatus === 'reschedulepending'
          ? 'pending'
          : 'declined'

  return {
    id: text(item.leaseId ?? item.id),
    tenant: text(tenant.name ?? item.tenantName) || 'Tenant',
    propertyId: text(item.listingId ?? listing.id),
    slot,
    status,
    scheduledDate: scheduled || undefined,
    actualDate: actual || undefined,
  }
}

export function transactionToLandlordPayment(raw: unknown): PaymentRecord {
  const payment = transactionToPayment(raw)
  const item = asRow(raw)
  const lease = asRow(item.lease)
  const tenant = asRow(item.tenant ?? lease.tenant)
  return {
    id: payment.id,
    tenant: text(tenant.name ?? item.tenantName) || 'Tenant',
    propertyTitle: payment.propertyTitle || text(lease.listingTitle) || 'Lease payment',
    amount: payment.amount,
    date: payment.date,
    status: payment.status === 'paid' ? 'paid' : 'pending',
  }
}

/* ---------------------------- admin dash mappers ---------------------------- */

function readAdminMetric(item: Row, keys: string[]): number {
  for (const key of keys) {
    const value = optionalNumber(item[key])
    if (value !== undefined && Number.isFinite(value)) return value
  }
  return 0
}

export function adminDashboardToMetrics(raw: unknown): AdminDashboardMetrics {
  const item = asRow(raw)
  const users = asRow(item.users ?? item.userSummary)
  const listings = asRow(item.listings ?? item.listingSummary)
  const leases = asRow(item.leases ?? item.leaseSummary)
  const escrow = asRow(item.escrowInFlight ?? item.inFlight)
  const transactions = asRow(item.transactions)

  const tenantTotal = readAdminMetric(users, ['total', 'tenantsCount'])
  const landlordTotal = readAdminMetric(users, ['landlords', 'landlordsCount'])
  const caretakerTotal = readAdminMetric(users, ['caretakers', 'caretakersCount'])
  const agentTotal = readAdminMetric(users, ['agents', 'agentsCount'])

  const ledgerTotals = arrayValue(transactions.totals)
    .map((entry) => asRow(entry))
    .map((row) => ({
      type: numberValue(row.type),
      currency: text(row.currency) || 'NGN',
      total: numberValue(row.total),
      count: numberValue(row.count),
    }))
    .filter((row) => row.count > 0 || row.total > 0)

  const transactionsCount = ledgerTotals.reduce((sum, row) => sum + row.count, 0)
  const transactionsVolume = ledgerTotals.reduce((sum, row) => sum + row.total, 0)

  return {
    totalUsers: readAdminMetric(users, ['total', 'usersCount']) || readAdminMetric(item, ['totalUsers', 'usersCount', 'userCount']),
    totalLandlords: landlordTotal || readAdminMetric(item, ['totalLandlords', 'landlordsCount']),
    totalTenants: tenantTotal || readAdminMetric(item, ['totalTenants', 'tenantsCount']),
    totalCaretakers: caretakerTotal + agentTotal || readAdminMetric(item, ['totalCaretakers', 'caretakersCount', 'agentsCount']),
    totalLawyers: readAdminMetric(users, ['lawyers', 'lawyersCount']) || readAdminMetric(item, ['totalLawyers', 'lawyersCount']),
    pendingLawyers: readAdminMetric(users, ['pendingLawyers', 'pendingLawyerCount']) || readAdminMetric(item, ['pendingLawyers']),
    listingsCount: readAdminMetric(listings, ['total', 'totalListings']) || readAdminMetric(item, ['listingsCount', 'totalListings']),
    pendingListings: readAdminMetric(listings, ['draft', 'pending', 'listingsPending']) || readAdminMetric(item, ['pendingListings', 'listingsPending']),
    publishedListings: readAdminMetric(listings, ['published', 'publishedListings']) || readAdminMetric(item, ['publishedListings', 'listingsPublished']),
    leasesCount: readAdminMetric(leases, ['total', 'totalLeases']) || readAdminMetric(item, ['leasesCount', 'totalLeases']),
    activeLeases:
      readAdminMetric(leases, ['fundedInEscrow']) + readAdminMetric(leases, ['releasing']) ||
      readAdminMetric(item, ['activeLeases', 'leasesActive']),
    escrowHeld: readAdminMetric(escrow, ['amount']) || readAdminMetric(item, ['escrowHeld', 'escrowBalance', 'heldInEscrow']),
    totalTransactions: transactionsCount || readAdminMetric(item, ['totalTransactions', 'transactionsCount']),
    transactionVolume: transactionsVolume || readAdminMetric(item, ['transactionVolume', 'transactionsVolume']),
    ledgerTotals,
  }
}

export function adminTransactionToPoint(raw: unknown): TransactionPoint {
  const item = asRow(raw)
  const rawDate = text(item.period ?? item.date ?? item.label ?? item.bucket)
  const parsed = new Date(rawDate)
  const date =
    !rawDate || Number.isNaN(parsed.getTime())
      ? rawDate || '—'
      : parsed.toLocaleString('en-GB', { month: 'short' })
  const funded = numberValue(item.funded)
  const paidOut = numberValue(item.paidOut)
  return {
    date,
    count: numberValue(item.count ?? item.failedAttempts),
    volume: funded + paidOut || numberValue(item.volume ?? item.amount ?? item.totalAmount ?? item.value),
  }
}

const LAWYER_STATUSES: LawyerApprovalStatus[] = ['pending', 'verified', 'rejected', 'suspended']

export function adminLawyerToRecord(raw: unknown): AdminLawyerRecord {
  const item = asRow(raw)
  const rawStatus = text(item.status)
  const lower = rawStatus.toLowerCase()
  const numeric = /^\d+$/.test(lower)
  const statusInt = numeric ? optionalNumber(item.status) : undefined
  const status: LawyerApprovalStatus =
    statusInt !== undefined
      ? LawyerStatusAt(statusInt)
      : LAWYER_STATUSES.includes(lower as LawyerApprovalStatus)
        ? (lower as LawyerApprovalStatus)
        : 'pending'
  const name = text(item.name) || [text(item.firstName), text(item.lastName)].filter(Boolean).join(' ')
  return {
    id: text(item.id) || text(item.userId),
    name: name || 'Unnamed lawyer',
    email: text(item.email),
    barNumber: text(item.barNumber) || '—',
    status,
    kycVerified: item.identityVerified === true || item.kycVerified === true || text(item.kycStatus).toLowerCase() === 'verified',
    submittedAt: formatShortDate(item.submittedAt ?? item.appliedAt) || '—',
  }
}

function LawyerStatusAt(value: number): LawyerApprovalStatus {
  const index = Math.max(0, Math.min(LAWYER_STATUSES.length - 1, Math.trunc(value)))
  return LAWYER_STATUSES[index]
}

export function adminListingToRecord(raw: unknown): AdminListingRecord {
  const item = asRow(raw)
  const listing = listingToProperty(item)
  const owner = asRow(item.owner ?? item.landlord)
  const lower = text(item.status).toLowerCase()
  const statusInt = optionalNumber(item.status)
  const status: AdminListingStatus =
    statusInt === 2 || lower.includes('unpublish')
      ? 'unpublished'
      : statusInt === 3 || lower.includes('close')
        ? 'closed'
        : statusInt === 1 || lower.includes('publish')
          ? 'published'
          : 'pending'
  const rawLocation = text(item.location ?? item.propertyLocation ?? item.area)
  return {
    id: listing.id,
    title: listing.title,
    location: rawLocation || (listing.location === 'Nigeria' ? '' : listing.location),
    owner:
      text(item.ownerName) || text(owner.name) || text(item.landlordName) || '—',
    rent: listing.price,
    status,
    ownershipVerified: item.propertyVerified === true || item.ownershipVerified === true || item.verified === true,
    submittedAt:
      formatShortDate(item.submittedAt ?? item.createdAt ?? item.publishedAt) || 'Recently',
  }
}

export function adminFeeSettingsToRecord(raw: unknown): AdminFeeSettings {
  const item = asRow(raw)
  return {
    platformCommissionRate: readAdminMetric(item, ['platformCommissionRate', 'commissionRate', 'platformRate']),
    legalFeeRate: readAdminMetric(item, ['legalFeeRate', 'legalReviewRate', 'legalRate']),
  }
}

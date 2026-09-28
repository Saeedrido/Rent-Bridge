import { useEffect, useState } from 'react'
import { PageHeading, StatusPill, EmptyState, DataErrorBanner, useToast } from './shared'
import { apiErrorMessage } from '../../../services/api/fallback'
import {
  getPropertyReviews,
  startDocumentReview,
  verifyDocument,
  rejectDocument,
  verifyProperty,
  type PropertyReviewItem,
} from '../../../services/api/propertyApi'


type QueueRole = 'lawyer' | 'admin'

function str(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function normalizeStatus(value: unknown): string {
  const s = str(value)
  const lower = s.toLowerCase()
  if (lower.includes('under') || lower.includes('inreview') || lower.includes('review')) return 'UnderReview'
  if (lower.includes('verified')) return 'Verified'
  if (lower.includes('reject')) return 'Rejected'
  return 'Uploaded'
}

function statusLabel(status: string): string {
  if (status === 'UnderReview') return 'In review'
  if (status === 'Uploaded') return 'Uploaded'
  if (status === 'Verified') return 'Verified'
  if (status === 'Rejected') return 'Rejected'
  if (/under|review/i.test(status)) return 'In review'
  if (/verif/i.test(status)) return 'Verified'
  if (/reject/i.test(status)) return 'Rejected'
  return status
}



interface ReviewRecord {
  property: PropertyReviewItem
  documents: Array<{ documentId: string; fileKey: string; status: string; verifiedByName?: string | null; rejectionReason?: string | null }>
  verifiedByName?: string | null
  verifiedByRole?: string | null
  assignedLawyerName?: string | null
  isVerified: boolean
}

function toRecord(review: PropertyReviewItem): ReviewRecord {
  return {
    property: review,
    isVerified: review.isVerified === true || /verif/i.test(str(review.isVerified)),
    verifiedByName: review.verifiedByName,
    verifiedByRole: review.verifiedByRole,
    assignedLawyerName: review.assignedLawyerName,
    documents: (Array.isArray(review.documents) ? review.documents : []).map((d) => ({
      documentId: str(d.documentId),
      fileKey: str(d.fileKey),
      status: normalizeStatus(d.status),
      verifiedByName: d.verifiedByName,
      rejectionReason: d.rejectionReason,
    })),
  }
}

export function OwnershipReviewQueue({ role }: { role: QueueRole }) {
  const { show } = useToast()
  const [records, setRecords] = useState<ReviewRecord[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<{ propertyId: string; documentId: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    let active = true
    getPropertyReviews()
      .then((rows) => {
        if (!active) return
        setRecords((rows ?? []).map(toRecord))
      })
      .catch((err) => {
        if (active) setLoadError(apiErrorMessage(err) || 'Could not load ownership reviews right now.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const patch = (propertyId: string, fn: (record: ReviewRecord) => ReviewRecord) => {
    setRecords((prev) => prev.map((r) => (r.property.propertyId === propertyId ? fn(r) : r)))
  }

  const runWithBusy = async (key: string, action: () => Promise<unknown>, successMessage?: string) => {
    setBusy(key)
    try {
      await action()
      if (successMessage) show(successMessage)
      return true
    } catch (err) {
      show(apiErrorMessage(err) || 'Could not update this review right now.')
      return false
    } finally {
      setBusy(null)
    }
  }

  const handleStartReview = (propertyId: string, documentId: string) => {
    runWithBusy(`start-${documentId}`, () => startDocumentReview(propertyId, documentId), 'Document moved to review.')
      .then((ok) => {
        if (ok) patch(propertyId, (r) => ({ ...r, documents: r.documents.map((d) => (d.documentId === documentId ? { ...d, status: 'UnderReview' } : d)) }))
      })
  }

  const handleVerifyDoc = (propertyId: string, documentId: string) => {
    runWithBusy(`verify-${documentId}`, () => verifyDocument(propertyId, documentId)).then((ok) => {
      if (ok) {
        patch(propertyId, (r) => ({ ...r, documents: r.documents.map((d) => (d.documentId === documentId ? { ...d, status: 'Verified', verifiedByName: undefined } : d)) }))
        show('Document verified')
      }
    })
  }

  const handleRejectDoc = (propertyId: string, documentId: string) => {
    const reason = rejectReason.trim()
    runWithBusy(`reject-${documentId}`, () => rejectDocument(propertyId, documentId, reason || undefined)).then((ok) => {
      if (ok) {
        patch(propertyId, (r) => ({ ...r, documents: r.documents.map((d) => (d.documentId === documentId ? { ...d, status: 'Rejected', rejectionReason: reason || 'No reason given' } : d)) }))
        setRejectTarget(null)
        setRejectReason('')
        show('Document rejected')
      }
    })
  }

  const handleVerifyProperty = (propertyId: string) => {
    runWithBusy(`property-${propertyId}`, () => verifyProperty(propertyId)).then((ok) => {
      if (ok) {
        patch(propertyId, (r) => ({ ...r, isVerified: true }))
        show('Ownership verified. Listings for this property can go live.')
      }
    })
  }

  const docCount = records.reduce((n, r) => n + r.documents.length, 0)
  const verifiedCount = records.reduce((n, r) => n + r.documents.filter((d) => d.status === 'Verified').length, 0)
  const pendingProps = records.filter((r) => !r.isVerified)
  const verifiedProps = records.filter((r) => r.isVerified)

  return (
    <div className="space-y-6">
      <PageHeading
        title="Ownership document reviews"
        subtitle={
          role === 'lawyer'
            ? `${records.length} propert${records.length === 1 ? 'y' : 'ies'} assigned to you · ${docCount} document${docCount === 1 ? '' : 's'} · ${verifiedCount} verified.`
            : `${records.length} propert${records.length === 1 ? 'y' : 'ies'} on the platform · ${docCount} document${docCount === 1 ? '' : 's'} · ${verifiedCount} verified.`
        }
      />

      <DataErrorBanner message={loadError} />

      {loading ? (
        <div className="rounded-xl border border-sage bg-white p-8 text-sm text-mist">Loading ownership reviews…</div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={<DocumentIcon className="text-2xl" />}
          title="No ownership reviews"
          body={
            role === 'lawyer'
              ? 'Properties assigned to you for document review will appear here.'
              : 'Properties awaiting ownership verification will appear here.'
          }
        />
      ) : (
        <>
          {pendingProps.map((record) => (
            <ReviewCard
              key={record.property.propertyId}
              record={record}
              busy={busy}
              rejectTarget={rejectTarget}
              setRejectTarget={(t) => {
                setRejectTarget(t)
                setRejectReason('')
              }}
              rejectReason={rejectReason}
              setRejectReason={setRejectReason}
              onStart={handleStartReview}
              onVerifyDoc={handleVerifyDoc}
              onRejectDoc={handleRejectDoc}
              onVerifyProperty={handleVerifyProperty}
            />
          ))}

          {verifiedProps.length > 0 && (
            <div>
              <h3 className="font-serif text-xl font-semibold text-forest mb-4">Verified properties</h3>
              <div className="rounded-xl border border-sage bg-white divide-y divide-sage-line">
                {verifiedProps.map((record) => (
                  <div key={record.property.propertyId} className="flex flex-col sm:flex-row sm:items-center gap-2 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink truncate">
                        {addressLabel(record.property)} · {ownerLabel(record)}
                      </p>
                      <p className="text-xs text-mist mt-0.5">
                        {record.documents.length} document{record.documents.length === 1 ? '' : 's'} ·{' '}
                        {record.property.assignedLawyerName ? `Assigned lawyer: ${record.property.assignedLawyerName}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-[13px] font-medium text-forest">
                      {record.verifiedByName
                        ? `Verified by ${record.verifiedByName}${record.verifiedByRole ? ` (${record.verifiedByRole})` : ''}`
                        : 'Verified'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ReviewCard({
  record,
  busy,
  rejectTarget,
  setRejectTarget,
  rejectReason,
  setRejectReason,
  onStart,
  onVerifyDoc,
  onRejectDoc,
  onVerifyProperty,
}: {
  record: ReviewRecord
  busy: string | null
  rejectTarget: { propertyId: string; documentId: string } | null
  setRejectTarget: (target: { propertyId: string; documentId: string } | null) => void
  rejectReason: string
  setRejectReason: (value: string) => void
  onStart: (propertyId: string, documentId: string) => void
  onVerifyDoc: (propertyId: string, documentId: string) => void
  onRejectDoc: (propertyId: string, documentId: string) => void
  onVerifyProperty: (propertyId: string) => void
}) {
  const property = record.property
  const allDocsVerified = record.documents.length > 0 && record.documents.every((d) => d.status === 'Verified')

  return (
    <section className="rounded-xl border border-sage bg-white overflow-hidden">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-sage-line px-5 py-4">
        <div className="min-w-0">
          <h3 className="font-serif text-[16px] sm:text-lg font-semibold text-forest break-words">
            {addressLabel(property)}
          </h3>
          <p className="mt-1 text-sm text-mist">
            {[property.propertyType, `${property.bedrooms ?? 0} bed`, `${property.bathrooms ?? 0} bath`].filter(Boolean).join(' · ')}
            {property.ownerName && <span> · Owner: {property.ownerName}</span>}
          </p>
          {record.assignedLawyerName && (
            <p className="mt-1 text-xs text-mist">Assigned lawyer: {record.assignedLawyerName}</p>
          )}
          {record.isVerified && record.verifiedByName && (
            <p className="mt-1 text-[13px] font-medium text-forest">
              Verified by {record.verifiedByName}
              {record.verifiedByRole ? ` (${record.verifiedByRole})` : ''}
            </p>
          )}
        </div>
        <StatusPill tone={record.isVerified ? 'signed' : 'pending'}>
          {record.isVerified ? 'Ownership verified' : 'Ownership pending'}
        </StatusPill>
      </header>

      {record.documents.length === 0 ? (
        <div className="px-5 py-6 text-sm text-mist">
          No documents attached to this property yet.
        </div>
      ) : (
        <ul className="divide-y divide-sage-line">
          {record.documents.map((doc, index) => {
            const isRejecting = rejectTarget?.propertyId === property.propertyId && rejectTarget.documentId === doc.documentId
            console.log('[DOC DEBUG] Document:', { documentId: doc.documentId, fileKey: doc.fileKey, status: doc.status })
            
            const handleViewDocument = (e: React.MouseEvent) => {
              e.preventDefault()
              if (!doc.fileKey) return
              // Use regular URL for documents with access_mode: public (new uploads)
              // Add cache buster to bypass CDN cache
              const url = doc.fileKey + (doc.fileKey.includes('?') ? '&' : '?') + 't=' + Date.now()
              console.log('[DOC DEBUG] Opening document:', url)
              window.open(url, '_blank', 'noopener,noreferrer')
            }
            
            return (
              <li key={doc.documentId} className="px-5 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sage-soft text-forest">
                      <DocumentIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate" title={doc.fileKey}>
                        Document {index + 1}
                        {doc.fileKey && (
                          <a
                            href="#"
                            onClick={handleViewDocument}
                            className="ml-2 font-normal text-forest hover:underline"
                          >
                            View
                          </a>
                        )}
                      </p>
                      <p className="text-xs text-mist mt-0.5">
                        {statusLabel(doc.status)}
                        {doc.verifiedByName ? ` · verified by ${doc.verifiedByName}` : ''}
                        {doc.rejectionReason ? ` · ${doc.rejectionReason}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!record.isVerified && (
                      <>
                        {doc.status === 'Uploaded' && (
                          <ActionButton
                            label="Start review"
                            tone="forest"
                            busy={busy === `start-${doc.documentId}`}
                            onClick={() => onStart(property.propertyId, doc.documentId)}
                          />
                        )}
                        {doc.status === 'UnderReview' && (
                          <>
                            <ActionButton
                              label="Verify"
                              tone="forest"
                              busy={busy === `verify-${doc.documentId}`}
                              onClick={() => onVerifyDoc(property.propertyId, doc.documentId)}
                            />
                            <ActionButton
                              label="Reject"
                              tone="reject"
                              busy={busy === `reject-${doc.documentId}`}
                              onClick={() =>
                                isRejecting
                                  ? setRejectTarget(null)
                                  : setRejectTarget({ propertyId: property.propertyId, documentId: doc.documentId })
                              }
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {isRejecting && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center rounded-lg bg-sand/60 border border-sage px-3 py-3">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection (optional)"
                      className="min-w-0 flex-1 rounded-lg border border-sage bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/40"
                    />
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => onRejectDoc(property.propertyId, doc.documentId)}
                        disabled={busy === `reject-${doc.documentId}`}
                        className="rounded-lg bg-[#B42318] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#912018] disabled:opacity-50"
                      >
                        {busy === `reject-${doc.documentId}` ? 'Rejecting…' : 'Confirm reject'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectTarget(null)}
                        className="rounded-lg border border-sage px-4 py-2 text-[13px] font-semibold text-mist transition-colors hover:text-forest"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {!record.isVerified && (
        <footer className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-sage-line bg-sand/40 px-5 py-4">
          <p className="text-sm text-mist">
            {allDocsVerified
              ? 'All documents verified — confirm ownership to publish listings for this property.'
              : 'Verify every document to unlock this property for publishing.'}
          </p>
          <button
            type="button"
            disabled={!allDocsVerified || busy === `property-${property.propertyId}`}
            onClick={() => onVerifyProperty(property.propertyId)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-flame px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === `property-${property.propertyId}` ? 'Verifying…' : 'Verify ownership'}
          </button>
        </footer>
      )}
    </section>
  )
}

function ActionButton({
  label,
  tone,
  busy,
  onClick,
}: {
  label: string
  tone: 'forest' | 'reject'
  busy: boolean
  onClick: () => void
}) {
  const cls =
    tone === 'forest'
      ? 'bg-forest text-white hover:bg-forest-deep'
      : 'border border-[#E4C7C7] text-[#B42318] hover:bg-[#FDE8E8]'
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors disabled:opacity-50 ${cls}`}
    >
      {busy ? '⋯' : label}
    </button>
  )
}

function addressLabel(p: PropertyReviewItem): string {
  return [p.street, p.area, p.city, p.state].filter(Boolean).join(', ') || 'Property'
}

function ownerLabel(record: ReviewRecord): string {
  return record.property.ownerName ? `Owner: ${record.property.ownerName}` : 'Owner'
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  )
}
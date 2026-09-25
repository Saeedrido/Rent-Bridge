import { useEffect, useRef, useState } from 'react'
import { Seo } from '../../../components/common'
import { SearchIcon, AgreementIcon } from '../components/icons'
import { ChevronRightIcon, DownloadIcon, FileSearchIcon as SharedFileSearchIcon } from './shared'
import { RoleDashboardShell, type NotificationItem, type ShellUser } from './RoleDashboardShell'
import {
  StatusPill,
  PageHeading,
  EmptyState,
  DataErrorBanner,
  useToast,
} from './shared'
import { naira } from './data'
import { SettingsContent } from '../settings/SettingsPage'
import {
  listCallerLeases,
  getLeaseAgreement,
  getLeaseAgreementPdf,
  certifyLease,
} from '../../../services/api/leaseApi'
import {
  agreementTermsToClauses,
  asRow,
  formatDate,
  formatShortDate,
} from '../../../services/api/mappers'
import { loadWithFallback } from '../../../services/api/fallback'
import { getUser } from '../../../services/api/tokens'
import { refreshProfile } from '../../../services/api/authApi'
import { ApiError } from '../../../services/api/client'
import type { AgreementClause } from '../tenant/tenantData'
import { OwnershipReviewQueue } from './OwnershipReviewQueue'

interface LawyerLease {
  id: string
  listingId?: string
  title: string
  tenant: string
  landlord: string
  status: string
  submitted: string
}

interface ReviewState {
  clauses: AgreementClause[]
  certified: boolean
  fullySigned: boolean
  draftedAt: string
  contentHash: string
  tenantLabel: string
  landlordLabel: string
  rentLabel: string
}

function str(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function leaseToLawyerRow(raw: unknown): LawyerLease {
  const item = asRow(raw)
  const tenant = asRow(item.tenant)
  const landlord = asRow(item.landlord)
  return {
    id: str(item.id) || str(item.leaseId),
    listingId: str(item.listingId) || undefined,
    title: str(item.listingTitle) || 'Lease review',
    tenant: str(tenant.name) || str(item.tenantName) || 'Tenant',
    landlord: str(landlord.name) || str(item.landlordName) || 'Landlord',
    status: str(item.status ?? item.state),
    submitted: formatShortDate(item.updatedAt ?? item.createdAt) || 'Submitted',
  }
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    Initiated: 'Initiated',
    InspectionRequested: 'Inspection requested',
    InspectionConfirmed: 'Inspection confirmed',
    LegalReview: 'In review',
    Certified: 'Certified',
    AwaitingSignatures: 'Awaiting signatures',
    PartiallySigned: 'Partially signed',
    FullySigned: 'Fully signed',
    FundedInEscrow: 'In escrow',
    Releasing: 'Releasing',
    Released: 'Released',
    Cancelled: 'Cancelled',
  }
  if (labels[status]) return labels[status]
  const lower = status.toLowerCase()
  if (lower.includes('legal')) return 'In review'
  if (lower.includes('certified')) return 'Certified'
  if (lower.includes('signed')) return 'Signed'
  return status.replace(/([a-z])([A-Z])/g, '$1 $2')
}

function statusTone(status: string): 'inreview' | 'waiting' | 'signed' {
  const lower = status.toLowerCase()
  if (lower.includes('legal')) return 'inreview'
  if (lower.includes('certified') || lower.includes('signed') || lower.includes('escrow') || lower.includes('release')) return 'signed'
  return 'waiting'
}

export function LawyerDashboard() {
  const { show } = useToast()
  const authUser = getUser()
  const [user, setUser] = useState({
    name:
      authUser?.name ||
      [authUser?.firstName, authUser?.lastName].filter(Boolean).join(' ') ||
      authUser?.email?.split('@')[0] ||
      'Lawyer',
    email: authUser?.email || '',
    phone: authUser?.phone || '',
  })
  const [verifiedLabel, setVerifiedLabel] = useState(
    authUser?.verified === true ? 'Verified Lawyer' : 'Lawyer',
  )

  const [activeTab, setActiveTab] = useState<string>('desk')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [leases, setLeases] = useState<LawyerLease[]>([])
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null)
  const [review, setReview] = useState<ReviewState | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    refreshProfile().then((profile) => {
      if (!active || !profile) return
      setUser((prev) => ({
        name:
          profile.name ||
          [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
          prev.name,
        email: profile.email || prev.email,
        phone: profile.phone || prev.phone,
      }))
      setVerifiedLabel(profile.verified === true ? 'Verified Lawyer' : 'Lawyer')
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    loadWithFallback(
      async () => (await listCallerLeases(1, 50)).map(leaseToLawyerRow),
      [] as LawyerLease[],
    ).then((result) => {
      if (active) {
        setLeases(result.data)
        if (result.error) setLoadError(result.error)
      }
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!activeReviewId) {
      setReview(null)
      setReviewError(null)
      return
    }
    let active = true
    setReviewLoading(true)
    setReviewError(null)
    getLeaseAgreement(activeReviewId)
      .then((agreement) => {
        if (!active) return
        const envelope = asRow(agreement)
        const terms = asRow(envelope.terms)
        const rent = asRow(terms.rent)
        const landlord = asRow(terms.landlord)
        const tenant = asRow(terms.tenant)
        const amount = Number(rent.amount ?? 0)
        setReview({
          clauses: agreementTermsToClauses(agreement),
          certified: envelope.isCertified === true,
          fullySigned: envelope.isFullySigned === true,
          draftedAt: formatDate(envelope.draftedAt),
          contentHash: typeof envelope.contentHash === 'string' ? envelope.contentHash : '',
          tenantLabel: str(tenant.name) || '—',
          landlordLabel: str(landlord.name) || '—',
          rentLabel: amount > 0 ? naira(amount) : '',
        })
      })
      .catch((err) => {
        if (active) {
          setReviewError(err instanceof ApiError ? err.message : 'Could not load the agreement right now.')
        }
      })
      .finally(() => {
        if (active) setReviewLoading(false)
      })
    return () => {
      active = false
    }
  }, [activeReviewId])

  const tabs = [
    { id: 'ownership', label: 'Ownership reviews', Icon: SearchIcon },
    { id: 'desk', label: 'Review desk', Icon: AgreementIcon },
    { id: 'current', label: 'Current review', Icon: AgreementIcon },
  ]

  const deskRows = leases.filter((l) => l.status.toLowerCase() === 'legalreview')

  const notifications: NotificationItem[] = deskRows.map((l) => ({
    id: `lawyer-notif-${l.id}`,
    text: `The agreement for ${l.title} is awaiting your review.`,
    time: l.submitted,
  }))

  const shellUser: ShellUser = {
    name: user.name,
    verifiedLabel,
    notificationCount: deskRows.length,
  }

  const activeLease = leases.find((l) => l.id === activeReviewId)

  const allChecked = review !== null && review.clauses.length > 0 && review.clauses.every((c) => checked[c.number])

  const prevReviewId = useRef(activeReviewId)
  if (prevReviewId.current !== activeReviewId) {
    setChecked({})
    setReviewError(null)
    prevReviewId.current = activeReviewId
  }

  const handleOpenReview = (id: string) => {
    setActiveReviewId(id)
    setActiveTab('current')
  }

  const handleCertify = async () => {
    if (!activeReviewId) return
    setSubmitting(true)
    try {
      await certifyLease(activeReviewId)
    } catch (err) {
      show(err instanceof ApiError ? err.message : 'Could not certify this agreement right now.')
      setSubmitting(false)
      return
    }
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toLowerCase()
    setLeases((prev) =>
      prev.map((l) =>
        l.id === activeReviewId ? { ...l, status: 'Certified', submitted: `certified ${today}` } : l,
      ),
    )
    setActiveReviewId(null)
    setActiveTab('desk')
    setSubmitting(false)
    show('Agreement certified and sent for signature')
  }

  const handleDownloadPdf = async (id: string) => {
    try {
      const blob = await getLeaseAgreementPdf(id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      show('Could not download the agreement PDF right now.')
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'ownership':
        return <OwnershipReviewQueue role="lawyer" />

      case 'desk':
        return (
          <>
            <PageHeading
              title="Review desk"
              subtitle={`${deskRows.length} agreement${deskRows.length === 1 ? '' : 's'} awaiting your certification.`}
            />
            <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px] items-start">
              <section aria-label="Awaiting review">
                {deskRows.length === 0 ? (
                  <EmptyState
                    icon={<SharedFileSearchIcon className="text-2xl" />}
                    title="No agreements awaiting review"
                    body="Agreements assigned to you will appear here."
                  />
                ) : (
                  <div className="space-y-3">
                    {deskRows.map((lease, i) => (
                      <button
                        key={lease.id}
                        type="button"
                        onClick={() => handleOpenReview(lease.id)}
                        className="anim-rise flex items-center gap-3 sm:gap-4 rounded-xl border border-sage bg-white p-3 sm:p-4 transition-shadow hover:shadow-sm"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sage-soft font-semibold text-forest">
                          <AgreementIcon />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif text-[15px] sm:text-[17px] font-semibold leading-snug text-forest truncate">
                            {lease.title}
                          </h3>
                          <p className="mt-1 text-xs sm:text-sm text-mist">
                            Tenant: {lease.tenant} · Landlord: {lease.landlord} · {lease.submitted}
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-3 sm:px-4 py-2 text-[13px] sm:text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark whitespace-nowrap">
                          Review
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <aside className="w-full lg:sticky lg:top-24 lg:self-start" aria-label="Review queue">
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-forest mb-4">
                  Assigned reviews
                </h2>
                <div className="space-y-3">
                  {leases.length === 0 ? (
                    <p className="rounded-xl border border-sage bg-white p-4 text-sm text-mist">
                      No lease reviews are assigned to you yet.
                    </p>
                  ) : (
                    leases.map((lease, i) => {
                      const inReview = lease.status.toLowerCase() === 'legalreview'
                      const canDownload =
                        !inReview &&
                        (lease.status.toLowerCase().includes('certified') ||
                          lease.status.toLowerCase().includes('signed') ||
                          lease.status.toLowerCase().includes('escrow'))
                      return (
                        <div
                          key={lease.id}
                          className={`anim-rise w-full flex items-start justify-between gap-3 rounded-xl border border-sage bg-white p-4 transition-colors ${
                            inReview ? 'cursor-pointer hover:border-forest/40' : ''
                          }`}
                          style={{ animationDelay: `${i * 60}ms` }}
                          role={inReview ? 'button' : undefined}
                          tabIndex={inReview ? 0 : undefined}
                          onClick={inReview ? () => handleOpenReview(lease.id) : undefined}
                          onKeyDown={
                            inReview
                              ? (e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    handleOpenReview(lease.id)
                                  }
                                }
                              : undefined
                          }
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-[14px] text-ink truncate">{lease.title}</p>
                            <p className="mt-1 text-[12px] sm:text-[13px] text-mist">
                              {lease.tenant} · {lease.submitted}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {canDownload && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownloadPdf(lease.id)
                                }}
                                aria-label={`Download ${lease.title} PDF`}
                                className="text-forest transition-colors hover:text-flame"
                              >
                                <DownloadIcon />
                              </button>
                            )}
                            <StatusPill tone={statusTone(lease.status)}>{statusLabel(lease.status)}</StatusPill>
                            {inReview && <ChevronRightIcon className="text-mist" />}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </aside>
            </div>
          </>
        )

      case 'current':
        if (!activeReviewId || !activeLease) {
          return (
            <div className="px-[clamp(16px,4vw,40px)]">
              <PageHeading title="Current review" subtitle="No agreement is currently under review." />
              <EmptyState
                icon={<SharedFileSearchIcon className="text-2xl" />}
                title="No agreement under review"
                body="Pick a review from your Review desk to begin."
                action={
                  <button
                    type="button"
                    onClick={() => setActiveTab('desk')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark"
                  >
                    Go to Review desk
                  </button>
                }
              />
            </div>
          )
        }

        return (
          <div className="px-[clamp(16px,4vw,40px)]">
            <PageHeading
              title="Current review"
              subtitle={`${activeLease.title} · ${statusLabel(activeLease.status)}`}
            />
            <div className="mt-8 space-y-6">
              <div className="rounded-xl border border-sage bg-white p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-serif text-xl sm:text-2xl font-semibold text-forest">{activeLease.title}</h2>
                    <p className="mt-1 text-sm text-mist">
                      Tenant: {review?.tenantLabel ?? activeLease.tenant} · Landlord:{' '}
                      {review?.landlordLabel ?? activeLease.landlord}
                      {review?.rentLabel && <span> · Rent: {review.rentLabel}/yr</span>}
                    </p>
                    {review?.draftedAt && (
                      <p className="mt-0.5 text-sm text-mist">Drafted {review.draftedAt}</p>
                    )}
                  </div>
                  <StatusPill tone={statusTone(activeLease.status)}>{statusLabel(activeLease.status)}</StatusPill>
                </div>
                {review?.contentHash && (
                  <p className="mt-3 border-t border-sage pt-3 text-[12px] text-mist break-all">
                    Content hash: {review.contentHash}
                  </p>
                )}
              </div>

              {reviewLoading ? (
                <div className="rounded-xl border border-sage bg-white p-8 text-sm text-mist">
                  Loading the agreement document…
                </div>
              ) : reviewError ? (
                <div className="rounded-xl border border-flame/40 bg-flame-soft p-6">
                  <p className="text-[15px] font-semibold text-flame">Could not load this review</p>
                  <p className="mt-1 text-sm text-[#374151]">{reviewError}</p>
                </div>
              ) : review ? (
                <>
                  <div className="rounded-xl border border-sage bg-white">
                    <div className="px-4 sm:px-6 py-4 border-b border-sage-line">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h3 className="font-semibold text-ink">Agreement clauses</h3>
                        <span className="text-sm text-mist">
                          {review.clauses.filter((c) => checked[c.number]).length} of{' '}
                          {review.clauses.length} verified
                        </span>
                      </div>
                    </div>
                    <ul className="divide-y divide-sage-line">
                      {review.clauses.map((clause) => (
                        <li
                          key={clause.number}
                          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-4 py-3.5 sm:px-6"
                        >
                          <label className="flex items-start gap-3 cursor-pointer text-[14px] sm:text-[15px] text-ink">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={checked[clause.number]}
                              onClick={() =>
                                setChecked((prev) => ({
                                  ...prev,
                                  [clause.number]: !prev[clause.number],
                                }))
                              }
                              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${
                                checked[clause.number]
                                  ? 'bg-forest border-forest text-white'
                                  : 'border-sage hover:border-forest/50'
                              }`}
                            >
                              {checked[clause.number] && (
                                <svg
                                  width={20}
                                  height={20}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={1.8}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="shrink-0"
                                  aria-hidden="true"
                                >
                                  <path d="M5 12.5l4.5 4.5L19 7" />
                                </svg>
                              )}
                            </button>
                            <span className="min-w-0">
                              <span className="font-semibold text-forest">
                                {clause.number}. {clause.title}
                              </span>
                              <span className="mt-1 block text-[#374151] leading-relaxed">
                                {clause.content}
                              </span>
                              {clause.note && (
                                <span className="mt-1 block text-xs text-mist">{clause.note}</span>
                              )}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(activeLease.id)}
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-forest/30 bg-white px-5 py-2.5 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft disabled:opacity-50"
                    >
                      <DownloadIcon />
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleCertify}
                      disabled={!allChecked || review.certified || submitting}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {review.certified
                        ? 'Agreement certified'
                        : submitting
                          ? 'Certifying…'
                          : 'Certify & request signature'}
                    </button>
                  </div>
                  {!allChecked && !review.certified && (
                    <p className="text-[13px] text-mist text-right sm:text-left">
                      Verify all clauses to enable certification.
                    </p>
                  )}
                  {review.fullySigned && (
                    <p className="text-[13px] text-mist text-right sm:text-left">
                      Both parties have signed this agreement.
                    </p>
                  )}
                </>
              ) : null}
            </div>
          </div>
        )

      case 'settings':
        return <SettingsContent role="lawyer" user={user} verifiedLabel={verifiedLabel} onProfileSave={setUser} />

      default:
        return null
    }
  }

  return (
    <>
      <Seo title="Lawyer Dashboard · Rent Bridge" description="Review and manage tenancy agreements" />
      <RoleDashboardShell
        user={shellUser}
        notifications={notifications}
        tabs={tabs}
        active={activeTab}
        onChange={setActiveTab}
      >
        <DataErrorBanner message={loadError} />
        {renderContent()}
      </RoleDashboardShell>
    </>
  )
}
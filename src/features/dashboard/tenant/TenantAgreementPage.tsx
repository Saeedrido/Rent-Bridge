import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronRightIcon, AlertTriangleIcon, InfoIcon, ShieldCheckIcon, PenIcon, AlertCircleIcon } from '../components/icons'
import { PageHeading, StatusPill, cn, formatPrice, DataErrorBanner, useToast } from '../roleDashboards/shared'
import { Spinner } from '../../../components/ui'
import type { TenantAgreement, AgreementClause } from './tenantData'
import { getLease, getLeaseAgreement, getLeaseAgreementPdf, signLease, fundEscrow } from '../../../services/api/leaseApi'
import { agreementTermsToClauses, isUuid, leaseToTenantAgreement, formatDate } from '../../../services/api/mappers'
import { apiErrorMessage } from '../../../services/api/fallback'
import { getListing } from '../../../services/api/listingApi'

const PLATFORM_COMMISSION_RATE = 0.05
const LAWYER_REVIEW_FEE = 45000

export function TenantAgreementPage() {
  const { id } = useParams<{ id: string }>()
  const [agreement, setAgreement] = useState<TenantAgreement | null | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { show } = useToast()

  const loadedOnce = useRef(false)

  const loadAgreement = useCallback(async () => {
    if (!id || !isUuid(id)) {
      setAgreement(null)
      return
    }
    try {
      const lease = await getLease(id)
      let clauses: AgreementClause[] = []
      try {
        clauses = agreementTermsToClauses(await getLeaseAgreement(id))
      } catch {
        clauses = []
      }
      const mapped = leaseToTenantAgreement(lease, clauses)
      const listingId = typeof lease.listingId === 'string' ? lease.listingId : undefined
      if (listingId) {
        const detail = await getListing(listingId).catch(() => null)
        if (detail) {
          const rent = detail.priceAmount ?? mapped.totalAmount
          const commission = Math.round(rent * PLATFORM_COMMISSION_RATE)
          const caution = detail.cautionFeeAmount ?? 0
          mapped.totalAmount = rent + commission + LAWYER_REVIEW_FEE + caution
          mapped.propertyTitle = detail.title || mapped.propertyTitle
          mapped.propertyLocation = [detail.area, detail.city].filter(Boolean).join(', ') || mapped.propertyLocation
          if (detail.availableFrom) mapped.term = `Available from ${formatDate(detail.availableFrom)}`
        }
      }
      setAgreement(mapped)
      loadedOnce.current = true
      setLoadError(null)
    } catch (err) {
      // A transient failure during a background poll must not discard a good copy of
      // the agreement (and with it the tenant's own signature state), so the error
      // view only replaces the content until something has loaded successfully.
      if (!loadedOnce.current) setAgreement(null)
      setLoadError(apiErrorMessage(err) || null)
    }
  }, [id])

  useEffect(() => {
    void loadAgreement()
  }, [loadAgreement])

  // The tenant can be waiting on the landlord's signature for an arbitrary amount of
  // time, so the signedParties snapshot taken at mount goes stale. Poll only while
  // a signature is genuinely outstanding, and pause while the tab is hidden.
  const waitingOnLandlord =
    agreement !== null &&
    agreement !== undefined &&
    agreement.status === 'awaiting-tenant' &&
    !agreement.signedParties.some((entry) => entry.toLowerCase() === 'landlord')

  useEffect(() => {
    if (!waitingOnLandlord) return
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void loadAgreement()
    }, 15000)
    return () => clearInterval(timer)
  }, [waitingOnLandlord, loadAgreement])

  if (agreement === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-[clamp(16px,4vw,40px)]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!agreement) {
    return (
      <div className="px-[clamp(16px,4vw,40px)] pt-8 pb-16">
        <DataErrorBanner message={loadError} />
        <PageHeading title="Agreement Not Found" subtitle="This agreement could not be found." />
      </div>
    )
  }

  const hasSigned = (party: string) =>
    agreement.signedParties.some((entry) => entry.toLowerCase() === party)
  const tenantSigned = hasSigned('tenant')
  const landlordSigned = hasSigned('landlord')

  const handleAcceptAndPay = async () => {
    if (!id || submitting) return

    setSubmitting(true)
    try {
      // Signing is independent per party, so the tenant signs either way. Only
      // PAYMENT requires both signatures — RecordFunding on the backend refuses a
      // single signature after the money has already left the tenant's account,
      // which strands the payment with no retry path. So gate the checkout, not
      // the signature.
      if (!tenantSigned) {
        await signLease(id)
        setAgreement((prev) =>
          prev ? { ...prev, signedParties: [...prev.signedParties, 'Tenant'] } : prev,
        )
      }

      if (!landlordSigned) {
        show('Signed. Waiting for your landlord to sign before payment can be made.')
        return
      }

      const res = await fundEscrow(id)
      const url = res.checkoutUrl ?? res.url
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
        show('Agreement signed. Opening secure checkout for your escrow payment.')
      } else {
        show('Agreement signed. Checkout is being prepared — see the Payments tab.')
      }
    } catch (err) {
      show(apiErrorMessage(err) || 'Could not accept and pay right now.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownload = async () => {
    if (!id) return
    try {
      const blob = await getLeaseAgreementPdf(id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `agreement-${id.slice(0, 8)}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      show('Could not download the agreement PDF right now.')
    }
  }

  const progressSteps = [
    { key: 'draft', label: 'Draft' },
    { key: 'lawyer-review', label: 'Lawyer Review' },
    { key: 'awaiting-tenant', label: 'Awaiting Tenant' },
    { key: 'signed', label: 'Signed' },
  ] as const

  const getStepStatus = (stepKey: string) => {
    const statusOrder = ['draft', 'lawyer-review', 'awaiting-tenant', 'signed']
    const currentIndex = statusOrder.indexOf(agreement.status)
    const stepIndex = statusOrder.indexOf(stepKey)

    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'current'
    return 'pending'
  }

  const scrollToClauseRef = (clauseNumber: number) => {
    const element = document.getElementById(`clause-${clauseNumber}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.classList.add('ring-2', 'ring-flame')
      setTimeout(() => element.classList.remove('ring-2', 'ring-flame'), 2000)
    }
  }

  return (
    <div className="px-[clamp(16px,4vw,40px)]">
      <DataErrorBanner message={loadError} />
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8 lg:gap-x-10">
        {/* Left Column - Agreement Document */}
        <div className="lg:w-[52%] flex-1 min-w-0">
          <div className="mb-4 flex flex-col lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-bold text-forest md:text-3xl lg:text-4xl truncate">
                Tenancy Agreement &mdash; {agreement.propertyTitle}
              </h1>
              <p className="mt-1 text-sm text-mist">
                {agreement.propertyLocation} &middot; {agreement.term}
              </p>
            </div>

            {/* Progress Tracker */}
            <div className="flex items-center gap-2 lg:flex-row flex-col lg:items-center lg:gap-4">
              <div className="hidden lg:flex items-center gap-2">
                {progressSteps.map((step, index) => {
                  const stepStatus = getStepStatus(step.key)
                  const isLast = index === progressSteps.length - 1

                  return (
                    <div key={step.key} className="flex items-center gap-2">
                      <div className="relative flex items-center justify-center">
                        {!isLast && (
                          <div
                            className={cn(
                              'absolute top-1/2 left-1/2 -translate-y-1/2 h-1 w-full -ml-2',
                              step.key !== 'signed' && 'w-full'
                            )}
                          >
                            <div
                              className={cn(
                                'h-full',
                                step.key === 'draft' || step.key === 'lawyer-review'
                                  ? 'bg-forest'
                                  : step.key === 'awaiting-tenant' && agreement.status === 'awaiting-tenant'
                                    ? 'bg-flame'
                                    : 'border-2 border-dashed border-sage bg-transparent'
                              )}
                            />
                          </div>
                        )}
                        <div
                          className={cn(
                            'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                            stepStatus === 'completed'
                              ? 'bg-forest text-white'
                              : stepStatus === 'current'
                                ? 'bg-flame text-white'
                                : 'bg-white border-2 border-sage text-sage'
                          )}
                        >
                          {index + 1}
                        </div>
                      </div>
                      <span className={cn(
                        'mt-2 text-center text-sm font-medium',
                        stepStatus === 'completed' ? 'text-forest' :
                        stepStatus === 'current' ? 'text-flame' :
                        'text-mist'
                      )}>
                        {step.label}
                      </span>
                      <span className={cn(
                        'text-center text-xs',
                        stepStatus === 'completed' ? 'text-forest' :
                        stepStatus === 'current' ? 'text-mist' : 'text-mist/60'
                      )}>
                        {(() => {
                          switch (step.key) {
                            case 'draft': return agreement.date
                            case 'lawyer-review': return agreement.lawyer.reviewingSince
                            case 'awaiting-tenant': return 'Awaiting action'
                            case 'signed': return 'Completed'
                            default: return '—'
                          }
                        })()}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2">
                {progressSteps.map((step, index) => {
                  const stepStatus = getStepStatus(step.key)
                  return (
                    <div key={step.key} className="flex flex-col items-center shrink-0 min-w-[80px]">
                      <div
                        className={cn(
                          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                          stepStatus === 'completed'
                            ? 'bg-forest text-white'
                            : stepStatus === 'current'
                              ? 'bg-flame text-white'
                              : 'bg-white border-2 border-sage text-sage'
                        )}
                      >
                        {index + 1}
                      </div>
                      <span className={cn(
                        'mt-1 text-center text-[11px] font-medium',
                        stepStatus === 'completed' ? 'text-forest' :
                        stepStatus === 'current' ? 'text-flame' :
                        'text-mist'
                      )}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Lawyer Info Bar */}
          <div className="mt-6 rounded-xl border border-sage bg-white p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage-soft text-lg font-semibold text-forest">
                {agreement.lawyer.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink truncate">Assigned lawyer: {agreement.lawyer.name}</p>
                <p className="mt-0.5 text-sm text-mist">{agreement.lawyer.barNumber} &middot; reviewing since {agreement.lawyer.reviewingSince}</p>
              </div>
              <StatusPill tone={agreement.status === 'lawyer-review' ? 'inreview' : agreement.status === 'signed' ? 'signed' : 'draft'}>
                {agreement.status.replace('-', ' ').toUpperCase()}
              </StatusPill>
            </div>
          </div>

          {/* Agreement Document */}
          <div className="mt-6 rounded-xl border border-sage bg-white overflow-hidden">
            <div className="bg-white border-b border-sage px-6 py-4 text-center">
              <h2 className="font-serif text-lg font-semibold uppercase tracking-[0.1em] text-forest">TENANCY AGREEMENT</h2>
              <p className="mt-1 text-sm text-mist">Made this {agreement.date}</p>
            </div>

            <div className="p-6 space-y-8 overflow-y-auto" style={{ maxHeight: '75vh' }}>
              {agreement.clauses.length === 0 ? (
                <div className="py-10 text-center text-sm text-mist">
                  The agreement document has not been uploaded yet. It will appear once the landlord submits the draft for lawyer review.
                </div>
              ) : agreement.clauses.map((clause, index) => (
                <div
                  key={clause.number}
                  id={`clause-${clause.number}`}
                  className={cn(
                    'relative pb-6 last:pb-0',
                    clause.flagged && 'pl-4 border-l-4 border-flame'
                  )}
                >
                  {clause.flagged && (
                    <div className="absolute -left-4 top-0 h-6 w-1 bg-flame rounded-r" />
                  )}
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="font-serif text-lg font-semibold text-forest flex-shrink-0">
                      {clause.number}.
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-forest">{clause.title}</h3>
                    {clause.flagged && (
                      <StatusPill tone="inreview" className="ml-auto shrink-0">
                        FLAGGED
                      </StatusPill>
                    )}
                    {clause.status === 'approved' && (
                      <StatusPill tone="signed" className="ml-auto shrink-0">
                        APPROVED
                      </StatusPill>
                    )}
                    {clause.status === 'updated' && (
                      <StatusPill tone="inreview" className="ml-auto shrink-0">
                        UPDATED
                      </StatusPill>
                    )}
                  </div>
                  <p className="text-[15px] text-[#374151] leading-relaxed pl-7">{clause.content}</p>
                  {clause.note && (
                    <div className="mt-3 pl-7 border-l-2 border-flame/30 bg-flame/5 rounded-r p-3 text-sm text-[#374151]">
                      <span className="font-semibold text-flame">LAWYER NOTE:</span> {clause.note}
                    </div>
                  )}
                  {index < agreement.clauses.length - 1 && <hr className="my-6 border-sage/30" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Lawyer Feedback */}
        <div className="lg:w-[48%] lg:sticky lg:top-24 lg:self-start space-y-6">
          <div className="rounded-xl border border-sage bg-white p-6">
            <h3 className="font-semibold text-lg text-forest mb-4">Lawyer Feedback</h3>
            {agreement.feedback.length === 0 ? (
              <p className="text-sm text-mist leading-relaxed">
                No lawyer feedback yet. Comments will appear here once the lawyer reviews the agreement.
              </p>
            ) : (
              <div className="space-y-4">
              {agreement.feedback.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-xl border bg-white p-4 transition-all',
                    item.type === 'flagged' && 'border-flame/30 border-l-4 border-flame',
                    item.type === 'note' && 'border-flame/30 border-l-4 border-flame',
                    item.type === 'approved' && 'border-forest/30 border-l-4 border-forest',
                    item.type === 'updated' && 'border-flame/30 border-l-4 border-flame',
                  )}
                  onClick={() => scrollToClauseRef(item.clauseRef)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                      item.type === 'flagged' && 'bg-flame-soft text-flame',
                      item.type === 'note' && 'bg-flame-soft text-flame',
                      item.type === 'approved' && 'bg-sage-soft text-forest',
                      item.type === 'updated' && 'bg-flame-soft text-flame',
                    )}>
                      {item.type === 'flagged' && <AlertTriangleIcon className="w-4 h-4" />}
                      {item.type === 'note' && <InfoIcon className="w-4 h-4" />}
                      {item.type === 'approved' && <ShieldCheckIcon className="w-4 h-4" />}
                      {item.type === 'updated' && <PenIcon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'text-xs font-bold uppercase tracking-[0.07em]',
                          item.type === 'flagged' && 'text-flame',
                          item.type === 'note' && 'text-flame',
                          item.type === 'approved' && 'text-forest',
                          item.type === 'updated' && 'text-flame',
                        )}>
                          {item.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-mist">on clause {item.clauseRef}</span>
                      </div>
                      <p className="text-sm text-[#374151] leading-relaxed">{item.message}</p>
                      {item.proposedEdit && (
                        <div className="mt-2 p-2 bg-sage/30 rounded text-sm text-[#374151]">
                          <span className="font-semibold text-forest">PROPOSED EDIT:</span> {item.proposedEdit}
                        </div>
                      )}
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-mist flex-shrink-0" />
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

          {/* Primary CTA */}
          <div className="rounded-xl border border-sage bg-white p-6 space-y-4">
            <div className="border-b border-sage pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-forest">TOTAL TO PAY</p>
              <div className="flex justify-between mt-2">
                <span className="font-semibold text-lg text-ink">Total package</span>
                <span className="font-serif text-2xl font-bold text-forest">{formatPrice(agreement.totalAmount)}</span>
              </div>
            </div>
            <button
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-6 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-flame-dark disabled:opacity-60"
              onClick={handleAcceptAndPay}
              disabled={agreement.status !== 'awaiting-tenant' || submitting}
            >
              {agreement.status === 'signed'
                ? 'Agreement Signed'
                : agreement.status === 'draft' || agreement.status === 'lawyer-review'
                  ? 'Awaiting lawyer review'
                  : submitting
                    ? 'Accepting…'
                    : 'Accept & pay into escrow'}
            </button>
            <p className="text-center text-sm text-mist">
              Nothing is payable until a lawyer has reviewed your agreement.
            </p>
          </div>

          {/* Agreement State - Signed */}
          {agreement.status === 'signed' && (
            <div className="rounded-xl border border-sage bg-white p-6 text-center">
              <ShieldCheckIcon className="w-12 h-12 mx-auto text-forest mb-3" />
              <h3 className="font-serif text-xl font-semibold text-forest mb-1">Agreement Signed</h3>
              <p className="text-sm text-mist">This agreement has been signed by all parties.</p>
              <button
                onClick={handleDownload}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-forest/30 bg-white px-5 py-2.5 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft"
              >
                <ChevronRightIcon className="w-4 h-4" />
                View signed agreement
              </button>
            </div>
          )}

          {agreement.status === 'draft' && (
            <div className="rounded-xl border border-sage bg-white p-6 text-center">
              <svg className="w-12 h-12 mx-auto text-mist mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2H7a2 2 0 01-2-2v-6" />
              </svg>
              <h3 className="font-serif text-xl font-semibold text-forest mb-1">Agreement in Draft</h3>
              <p className="text-sm text-mist mb-4">Your agreement is being prepared and will be sent for lawyer review shortly.</p>
            </div>
          )}

          {agreement.status === 'awaiting-tenant' && (
            <div className="rounded-xl border border-sage bg-white p-6">
              {/* Signature roster — the tenant is waiting on the other party here, so
                  showing who has actually signed is the difference between "stuck" and
                  "in progress". */}
              <div className="rounded-lg border border-mist/40 bg-sand/40 p-4 mb-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-mist mb-3">
                  Signatures
                </p>
                <ul className="space-y-2">
                  {([
                    { party: 'landlord', label: 'Landlord', signed: landlordSigned },
                    { party: 'tenant', label: 'You (tenant)', signed: tenantSigned },
                  ] as const).map((row) => (
                    <li key={row.party} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-forest">{row.label}</span>
                      {row.signed ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-forest">
                          <ShieldCheckIcon className="w-4 h-4 text-forest" />
                          Signed
                        </span>
                      ) : row.party === 'landlord' ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-mist">
                          <span className="inline-block h-2 w-2 rounded-full bg-flame animate-pulse" />
                          Awaiting signature
                        </span>
                      ) : (
                        <span className="text-sm text-mist">Not signed yet</span>
                      )}
                    </li>
                  ))}
                </ul>
                {!landlordSigned && (
                  <p className="text-xs text-mist mt-3">
                    This page updates on its own every 15 seconds, so you will see the button
                    change to &ldquo;Pay into escrow&rdquo; as soon as your landlord signs.
                  </p>
                )}
              </div>
              <AlertCircleIcon className="w-12 h-12 mx-auto text-flame mb-3" />
              <h3 className="font-serif text-xl font-semibold text-forest mb-1">Action Required</h3>
              {landlordSigned ? (
                <p className="text-sm text-mist mb-4">
                  The lawyer has completed their review and your landlord has signed. Review the
                  feedback, then sign to pay into escrow.
                </p>
              ) : (
                <p className="text-sm text-mist mb-4">
                  The lawyer has completed their review. You can sign now — payment opens once your
                  landlord has signed too.
                </p>
              )}
              <button
                onClick={handleAcceptAndPay}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-6 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-flame-dark disabled:opacity-60"
              >
                {submitting
                  ? 'Working…'
                  : tenantSigned
                    ? landlordSigned
                      ? 'Pay into escrow'
                      : 'Waiting for landlord'
                    : landlordSigned
                      ? 'Accept & pay into escrow'
                      : 'Sign agreement'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


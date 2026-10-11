import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronRightIcon, AlertTriangleIcon, InfoIcon, ShieldCheckIcon, PenIcon, AlertCircleIcon } from '../components/icons'
import { PageHeading, StatusPill, cn, formatPrice, DataErrorBanner, useToast } from '../roleDashboards/shared'
import { Spinner } from '../../../components/ui'
import type { TenantAgreement, AgreementClause } from './tenantData'
import {
  getLease,
  getLeaseAgreement,
  getLeaseAgreementPdf,
  signLease,
  fundEscrow,
  downloadAgreementDocumentFile,
  viewAgreementDocument,
  uploadSignedAgreementDocument,
  submitAgreementDocumentForReview,
} from '../../../services/api/leaseApi'
import { uploadFile } from '../../../services/api/uploadApi'
import { agreementTermsToClauses, isUuid, leaseToTenantAgreement, formatDate } from '../../../services/api/mappers'
import { apiErrorMessage } from '../../../services/api/fallback'
import { getListing } from '../../../services/api/listingApi'

export function TenantAgreementPage() {
  const { id } = useParams<{ id: string }>()
  const [agreement, setAgreement] = useState<TenantAgreement | null | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [docBusy, setDocBusy] = useState(false)
  const { show } = useToast()

  const loadedOnce = useRef(false)
  const signedInputRef = useRef<HTMLInputElement | null>(null)

  // Dev-only diagnostic. The signature roster, the pay gate and the pending banner
  // are all driven by lease.signedParties, and a stale or missing field there
  // presents as a confusing domain error ("must be certified before signing") with
  // nothing in the UI to explain it. Logged in dev so the browser console can be
  // pasted straight into a bug report.
  // Diagnostic, deliberately NOT behind import.meta.env.DEV: that flag is compiled
  // out of a production build, which is exactly where a stale-bundle or stale-state
  // bug needs explaining. Flat single line so it is readable in the console without
  // expanding anything (the object is a second arg purely for drill-down).
  useEffect(() => {
    if (!agreement) return
    const suspicious =
      agreement.status === 'awaiting-tenant' && agreement.signedParties.length === 0
    console.info(
      `[agreement]${suspicious ? ' SUSPICIOUS' : ''} lease=${id} status=${agreement.status} ` +
        `signed=[${agreement.signedParties.join('|')}] funded=${agreement.escrowFunded}`,
      { leaseId: id, status: agreement.status, signedParties: agreement.signedParties },
    )
  }, [agreement, id])

  const loadAgreement = useCallback(async (): Promise<TenantAgreement | null> => {
    if (!id || !isUuid(id)) {
      setAgreement(null)
      return null
    }
    try {
      const lease = await getLease(id)
      const listingId = typeof lease.listingId === 'string' ? lease.listingId : undefined
      const listingDetail = listingId ? await getListing(listingId).catch(() => null) : null

      let clauses: AgreementClause[] = []
      try {
        clauses = agreementTermsToClauses(
          await getLeaseAgreement(id),
          listingDetail?.rentFrequency,
        )
      } catch {
        clauses = []
      }
      const mapped = leaseToTenantAgreement(lease, clauses)
      if (listingDetail) {
        // Backend already provides the correct totalAmount (rent + caution + realHouseFee + agentFee)
        // in leaseToTenantAgreement via the API totalAmount field. No client-side fee additions needed.
        mapped.propertyTitle = listingDetail.title || mapped.propertyTitle
        mapped.propertyLocation = [listingDetail.area, listingDetail.city].filter(Boolean).join(', ') || mapped.propertyLocation
        if (listingDetail.availableFrom) mapped.term = `Available from ${formatDate(listingDetail.availableFrom)}`
        // The deployed API only reports LeaseDetailResponse.totalAmount once an
        // escrow payment exists, so TOTAL TO PAY read ₦0 for any unpaid agreement
        // even though the property page already showed the real package. Fall back
        // to recomputing it from the listing detail (the same formula the backend
        // uses and TenantPaymentsPage shows) so the card is never zero.
        const packageTotal =
          (listingDetail.priceAmount ?? 0) +
          (listingDetail.cautionFeeAmount ?? 0) +
          (listingDetail.realHouseFeeAmount ?? 0) +
          (listingDetail.agentFeeAmount ?? 0)
        if (!mapped.totalAmount && packageTotal > 0) {
          mapped.totalAmount = packageTotal
        }
      }
      setAgreement(mapped)
      loadedOnce.current = true
      setLoadError(null)
      // Returned so callers acting on signature state get the server's answer
      // rather than waiting a render for setState to settle.
      return mapped
    } catch (err) {
      // A transient failure during a background poll must not discard a good copy of
      // the agreement (and with it the tenant's own signature state), so the error
      // view only replaces the content until something has loaded successfully.
      if (!loadedOnce.current) setAgreement(null)
      setLoadError(apiErrorMessage(err) || null)
      return null
    }
  }, [id])

  useEffect(() => {
    void loadAgreement()
  }, [loadAgreement])

  // Handle payment callback redirect (?payment=success|failed&reference=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    const error = params.get('error')

    if (payment !== 'success' && payment !== 'failed') return

    let cancelled = false
    let timer: number | undefined

    // Paystack's browser redirect can arrive before its webhook has marked the
    // lease funded, so reload immediately and then poll briefly until
    // escrowFunded flips — that is what disables the pay-to-escrow action.
    let attempts = 0
    const refreshUntilFunded = async () => {
      const fresh = await loadAgreement()
      attempts += 1
      if (cancelled || fresh?.escrowFunded || attempts >= 6) return
      timer = window.setTimeout(refreshUntilFunded, 2500)
    }
    void refreshUntilFunded()

    if (payment === 'success') {
      show('Payment successful — your escrow is now funded.')
    } else {
      show(`Payment was not successful${error ? `: ${error}` : ''}. You can retry from the agreement page.`)
    }

    // Clean up URL so refresh doesn't re-trigger the toast
    const url = new URL(window.location.href)
    url.searchParams.delete('payment')
    url.searchParams.delete('error')
    url.searchParams.delete('leaseId')
    window.history.replaceState({}, '', url.toString())

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [loadAgreement, show])

  // The tenant can be waiting on another party for an arbitrary amount of time, so
  // the snapshot taken at mount goes stale. Poll only while something the tenant is
  // waiting for is genuinely outstanding, and pause while the tab is hidden.
  const docWaitingStatus = agreement
    ? (agreement.statusRaw ?? '').toLowerCase()
    : ''
  const waitingOnLandlord =
    agreement !== null &&
    agreement !== undefined &&
    agreement.status === 'awaiting-tenant' &&
    !agreement.signedParties.some((entry) => entry.toLowerCase() === 'landlord')
  // Document flow: waiting on the lawyer to upload, the landlord to sign/return,
  // the lawyer to approve the landlord, or the lawyer to approve the tenant.
  const waitingOnDocFlow =
    agreement !== null &&
    agreement !== undefined &&
    ['legal', 'landlordsigning', 'landlorddocinreview', 'tenantdocinreview'].some((s) =>
      docWaitingStatus.includes(s),
    )

  useEffect(() => {
    if (!waitingOnLandlord && !waitingOnDocFlow) return
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void loadAgreement()
    }, 15000)
    return () => clearInterval(timer)
  }, [waitingOnLandlord, waitingOnDocFlow, loadAgreement])

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

  const hasSigned = (party: string, source?: TenantAgreement | null) =>
    (source ?? agreement).signedParties.some((entry) => entry.toLowerCase() === party)
  const tenantSigned = hasSigned('tenant')
  const landlordSigned = hasSigned('landlord')

  // Document-based signing flow. The lease uses it once the lawyer has uploaded
  // the source document (or the lease status is one of the document statuses).
  const progress = agreement.progress
  const statusRaw = (agreement.statusRaw ?? '').toLowerCase()
  // Once the lawyer approves the tenant's signed copy the lease becomes
  // FullySigned and the lawyer's source document is purged, so
  // `hasOriginalDocument` flips back to false. Without the finalized/fully/escrow
  // checks the page fell back to the legacy certify-then-sign UI, whose pay
  // button calls the old /sign endpoint that rejects a FullySigned lease with
  // "Agreement must be certified before signing". Payment must key off the
  // document flow alone.
  const docFlow = Boolean(
    progress &&
      (progress.hasOriginalDocument ||
        progress.isFinalized ||
        agreement.escrowFunded ||
        statusRaw.includes('signing') ||
        statusRaw.includes('docinreview') ||
        statusRaw.includes('fully')),
  )
  type DocStage =
    | 'preparing'
    | 'landlord-signing'
    | 'landlord-review'
    | 'tenant-signing'
    | 'tenant-review'
    | 'payment'
    | 'escrowed'
  const docStage: DocStage = agreement.escrowFunded
    ? 'escrowed'
    : statusRaw.includes('fully')
      ? 'payment'
      : statusRaw.includes('tenantsigning')
        ? 'tenant-signing'
        : statusRaw.includes('tenantdocinreview')
          ? 'tenant-review'
          : statusRaw.includes('landlorddocinreview')
            ? 'landlord-review'
            : statusRaw.includes('landlordsigning')
              ? 'landlord-signing'
              : 'preparing'

  const docStageLabel: Record<DocStage, string> = {
    preparing: 'Awaiting lawyer',
    'landlord-signing': 'Landlord signing',
    'landlord-review': 'With lawyer',
    'tenant-signing': 'Your signature needed',
    'tenant-review': 'With lawyer',
    payment: 'Payment due',
    escrowed: 'In escrow',
  }

  const docSteps: { key: string; label: string; done: boolean; at?: string }[] = [
    {
      key: 'upload',
      label: 'Lawyer uploads the agreement',
      done: Boolean(progress?.hasOriginalDocument),
      at: progress?.originalDocumentUploadedAt,
    },
    {
      key: 'landlord-sign',
      label: 'Landlord signs their copy',
      done: Boolean(progress?.landlord.submitted || progress?.landlord.approved),
      at: progress?.landlord.submittedAt ?? progress?.landlord.uploadedAt,
    },
    {
      key: 'landlord-approve',
      label: 'Lawyer approves the landlord\u2019s copy',
      done: Boolean(progress?.landlord.approved),
      at: progress?.landlord.approvedAt,
    },
    {
      key: 'tenant-sign',
      label: 'You download, sign and return your copy',
      done: Boolean(progress?.tenant.submitted || progress?.tenant.approved),
      at: progress?.tenant.submittedAt ?? progress?.tenant.uploadedAt,
    },
    {
      key: 'tenant-approve',
      label: 'Lawyer approves your copy',
      done: Boolean(progress?.tenant.approved),
      at: progress?.tenant.approvedAt,
    },
  ]

  const handlePayEscrow = async () => {
    if (!id || submitting) return
    setSubmitting(true)
    try {
      const res = await fundEscrow(id)
      const url = res.checkoutUrl ?? res.url
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
        show('Opening secure checkout for your escrow payment.')
      } else {
        show('Checkout is being prepared — see the Payments tab.')
      }
    } catch (err) {
      show(apiErrorMessage(err) || 'Could not start your payment right now.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptAndPay = async () => {
    if (!id || submitting) return

    setSubmitting(true)
    try {
      // Step-by-step trace: this flow spans a cached page, two endpoints and a
      // domain guard, and "it didn't work" is otherwise impossible to place.
      const trace = (step: string, extra = '') =>
        console.info(`[pay] ${step}${extra ? ` ${extra}` : ''}`)

      trace('start', `clientTenantSigned=${tenantSigned} clientLandlordSigned=${landlordSigned}`)

      // Never trust the client's snapshot for a destructive step. A stale page, a
      // race with the landlord signing, or a stale bundle can all leave
      // signedParties empty while the tenant has in fact already signed — and
      // re-signing then fails with a confusing domain error ("Agreement must be
      // certified before signing") instead of moving on to payment. On any signing
      // failure, re-read who has actually signed and believe the server.
      if (!tenantSigned) {
        try {
          await signLease(id)
          trace('signed-as-tenant')
          setAgreement((prev) =>
            prev ? { ...prev, signedParties: [...prev.signedParties, 'Tenant'] } : prev,
          )
        } catch (err) {
          trace('sign-attempt-failed', apiErrorMessage(err) ?? 'unknown error')
          const fresh = await loadAgreement()
          const nowSigned = hasSigned('tenant', fresh)
          trace('sign-recheck', `serverSaysTenantSigned=${nowSigned}`)
          if (!nowSigned && !/already/i.test(apiErrorMessage(err) ?? '')) throw err
        }
      }

      // Same distrust after signing: the landlord may have signed since mount.
      const fresh = await loadAgreement()
      const landlordHasSigned = hasSigned('landlord', fresh)
      trace('landlord-recheck', `serverSaysLandlordSigned=${landlordHasSigned}`)
      if (!landlordHasSigned) {
        show('Signed. Waiting for your landlord to sign before payment can be made.')
        return
      }

      trace('calling-fundEscrow')
      const res = await fundEscrow(id)
      const url = res.checkoutUrl ?? res.url
      trace('fundEscrow-returned', `hasUrl=${Boolean(url)}`)
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
        show('Agreement signed. Opening secure checkout for your escrow payment.')
      } else {
        show('Agreement signed. Checkout is being prepared — see the Payments tab.')
      }
    } catch (err) {
      console.info(`[pay] FAILED ${apiErrorMessage(err) ?? 'unknown error'}`)
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

  // ---- Document-based signing flow (web) ----

  const handleDownloadSigned = async () => {
    if (!id || docBusy) return
    setDocBusy(true)
    try {
      await downloadAgreementDocumentFile(id, `agreement-${id.slice(0, 8)}.pdf`)
      await loadAgreement()
    } catch (err) {
      show(apiErrorMessage(err) || 'Could not download the agreement document right now.')
    } finally {
      setDocBusy(false)
    }
  }

  const handleViewAgreement = async () => {
    if (!id || docBusy) return
    setDocBusy(true)
    try {
      await viewAgreementDocument(id)
      await loadAgreement()
    } catch (err) {
      show(apiErrorMessage(err) || 'Could not open the agreement document right now.')
    } finally {
      setDocBusy(false)
    }
  }

  const handleSignedFilePicked = async (file: File | undefined) => {
    if (!id || !file || docBusy) return
    setDocBusy(true)
    try {
      const url = await uploadFile(file)
      await uploadSignedAgreementDocument(id, { url, fileName: file.name })
      await loadAgreement()
      show('Signed copy uploaded. Send it to the lawyer when you are ready.')
    } catch (err) {
      show(apiErrorMessage(err) || 'Could not upload your signed copy right now.')
    } finally {
      setDocBusy(false)
      if (signedInputRef.current) signedInputRef.current.value = ''
    }
  }

  const handleSubmitSigned = async () => {
    if (!id || docBusy) return
    setDocBusy(true)
    try {
      await submitAgreementDocumentForReview(id)
      await loadAgreement()
      show('Sent to the lawyer for approval.')
    } catch (err) {
      show(apiErrorMessage(err) || 'Could not send your signed copy right now.')
    } finally {
      setDocBusy(false)
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

          {docFlow && (
            <div className="rounded-xl border border-sage bg-white p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-lg text-forest">Agreement signing</h3>
                <StatusPill tone={docStage === 'escrowed' || docStage === 'payment' ? 'signed' : 'inreview'}>
                  {docStageLabel[docStage].toUpperCase()}
                </StatusPill>
              </div>

              {/* Status timeline — the tenant sees exactly how far the paper has travelled. */}
              <ol className="space-y-3">
                {docSteps.map((step) => (
                  <li key={step.key} className="flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                        step.done ? 'bg-forest text-white' : 'border-2 border-sage text-sage',
                      )}
                    >
                      {step.done ? '\u2713' : ''}
                    </span>
                    <div className="min-w-0">
                      <p className={cn('text-sm', step.done ? 'text-forest' : 'text-mist')}>{step.label}</p>
                      {step.done && step.at && (
                        <p className="text-xs text-mist">{formatDate(step.at)}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              <div className="border-t border-sage pt-4">
                {docStage === 'preparing' && (
                  <p className="text-sm text-mist">
                    Waiting for the lawyer to upload the agreement document. You will be able to
                    download it as soon as it is ready.
                  </p>
                )}
                {docStage === 'landlord-signing' && (
                  <p className="text-sm text-mist">
                    The agreement has been uploaded. Waiting for your landlord to download, sign and
                    return their copy.
                  </p>
                )}
                {docStage === 'landlord-review' && (
                  <p className="text-sm text-mist">
                    Your landlord has returned their signed copy. Waiting for the lawyer to approve
                    it — you will be able to sign next.
                  </p>
                )}
                {docStage === 'tenant-signing' && (
                  <div className="space-y-3">
                    {!progress?.tenant.downloaded ? (
                      <button
                        type="button"
                        onClick={handleDownloadSigned}
                        disabled={docBusy}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-6 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-flame-dark disabled:opacity-60"
                      >
                        {docBusy ? 'Opening…' : 'Download agreement to sign'}
                      </button>
                    ) : !progress?.tenant.uploaded ? (
                      <>
                        <p className="text-sm text-mist">
                          Downloaded. Sign the agreement, then upload the signed copy.
                        </p>
                        <button
                          type="button"
                          onClick={() => signedInputRef.current?.click()}
                          disabled={docBusy}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-6 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-flame-dark disabled:opacity-60"
                        >
                          {docBusy ? 'Uploading…' : 'Upload signed agreement'}
                        </button>
                      </>
                    ) : !progress?.tenant.submitted ? (
                      <>
                        <p className="text-sm text-mist">
                          Signed copy uploaded. Send it to the lawyer for approval.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={handleSubmitSigned}
                            disabled={docBusy}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-forest px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-forest/90 disabled:opacity-60"
                          >
                            {docBusy ? 'Sending…' : 'Send to lawyer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => signedInputRef.current?.click()}
                            disabled={docBusy}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-sage bg-white px-5 py-3.5 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft disabled:opacity-60"
                          >
                            Re-upload
                          </button>
                        </div>
                      </>
                    ) : null}
                    {progress?.tenant.downloaded && (
                      <button
                        type="button"
                        onClick={handleDownloadSigned}
                        disabled={docBusy}
                        className="text-sm text-forest underline decoration-forest/40 hover:decoration-forest"
                      >
                        Download again
                      </button>
                    )}
                  </div>
                )}
                {docStage === 'tenant-review' && (
                  <p className="text-sm text-mist">
                    Your signed copy is with the lawyer for approval. Payment will open once it is
                    approved.
                  </p>
                )}
                {docStage === 'payment' && (
                  <>
                    <p className="text-sm text-mist mb-3">
                      All parties have signed and the lawyer has approved. Complete your payment to
                      hold it in escrow.
                    </p>
                    <button
                      type="button"
                      onClick={handlePayEscrow}
                      disabled={submitting}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-6 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-flame-dark disabled:opacity-60"
                    >
                      {submitting ? 'Opening checkout…' : 'Pay into escrow'}
                    </button>
                    <button
                      type="button"
                      onClick={handleViewAgreement}
                      disabled={docBusy}
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-forest/30 bg-white px-5 py-3 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft disabled:opacity-60"
                    >
                      {docBusy ? 'Opening…' : 'View final agreement'}
                    </button>
                  </>
                )}
                {docStage === 'escrowed' && (
                  <>
                    <p className="text-sm text-forest">
                      Your payment is held securely in escrow.
                    </p>
                    <button
                      type="button"
                      onClick={handleViewAgreement}
                      disabled={docBusy}
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-forest/30 bg-white px-5 py-3 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft disabled:opacity-60"
                    >
                      {docBusy ? 'Opening…' : 'View final agreement'}
                    </button>
                  </>
                )}
              </div>

              <input
                ref={signedInputRef}
                type="file"
                accept="application/pdf,image/*,.doc,.docx"
                className="hidden"
                onChange={(e) => void handleSignedFilePicked(e.target.files?.[0])}
              />
            </div>
          )}

          {/* Primary CTA */}
          {!docFlow && (
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
              disabled={agreement.status !== 'awaiting-tenant' || submitting || agreement.escrowFunded}
            >
              {agreement.escrowFunded
                ? 'Payment complete'
                : agreement.status === 'signed'
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
          )}

          {/* Agreement State - Signed */}
          {!docFlow && agreement.status === 'signed' && (
            <div className="rounded-xl border border-sage bg-white p-6 text-center">
              <ShieldCheckIcon className="w-12 h-12 mx-auto text-forest mb-3" />
              <h3 className="font-serif text-xl font-semibold text-forest mb-1">
                {agreement.escrowFunded ? 'Payment in Escrow' : 'Agreement Signed'}
              </h3>
              <p className="text-sm text-mist">
                {agreement.escrowFunded
                  ? 'All parties have signed and your payment is held securely in escrow.'
                  : 'All parties have signed. Complete your payment to hold it in escrow.'}
              </p>
              {/* Signing flips the lease to FullySigned, which used to hide the pay
                  panel entirely — leaving a signed-but-unpaid tenant with no way to
                  pay from this screen. */}
              {!agreement.escrowFunded && (
                <button
                  onClick={handleAcceptAndPay}
                  disabled={submitting}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark disabled:opacity-60"
                >
                  {submitting ? 'Opening checkout…' : 'Pay into escrow'}
                </button>
              )}
              <button
                onClick={handleDownload}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-forest/30 bg-white px-5 py-2.5 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft"
              >
                <ChevronRightIcon className="w-4 h-4" />
                View signed agreement
              </button>
            </div>
          )}

          {!docFlow && agreement.status === 'draft' && (
            <div className="rounded-xl border border-sage bg-white p-6 text-center">
              <svg className="w-12 h-12 mx-auto text-mist mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2H7a2 2 0 01-2-2v-6" />
              </svg>
              <h3 className="font-serif text-xl font-semibold text-forest mb-1">Agreement in Draft</h3>
              <p className="text-sm text-mist mb-4">Your agreement is being prepared and will be sent for lawyer review shortly.</p>
            </div>
          )}

          {!docFlow && agreement.status === 'awaiting-tenant' && (
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
                disabled={submitting || agreement.escrowFunded}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-6 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-flame-dark disabled:opacity-60"
              >
                {agreement.escrowFunded
                  ? 'Paid into escrow'
                  : submitting
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


import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRightIcon, LockIcon, DataErrorBanner } from '../roleDashboards/shared'
import { PageHeading, StatusPill, cn } from '../roleDashboards/shared'
import { formatPrice } from './tenantUtils'
import { getPaymentStatusBadge, type Payment } from './tenantData'
import { loadWithFallback } from '../../../services/api/fallback'
import { getTransactions } from '../../../services/api/dashboardApi'
import { transactionToPayment } from '../../../services/api/mappers'
import { listCallerLeases } from '../../../services/api/leaseApi'
import { getListing } from '../../../services/api/listingApi'
import { pendingActionForLease } from './PendingAgreementBanner'

interface AgreementMoney {
  leaseId: string
  title: string
  location: string
  total: number
  /** 'none' once money is in escrow — the ledger below is the record from then on. */
  stage: 'signing' | 'payment-due' | 'escrowed' | 'released'
  stageLabel: string
  needsTenant: boolean
}

function readStage(lease: { status?: string; signedParties?: unknown }) {
  const status = String(lease.status ?? '').toLowerCase()
  const parties = Array.isArray(lease.signedParties)
    ? lease.signedParties
        .map((entry) =>
          typeof entry === 'string'
            ? entry
            : String((entry as { party?: unknown } | null)?.party ?? ''),
        )
        .filter(Boolean)
    : []
  const tenantSigned = parties.some((p) => p.toLowerCase() === 'tenant')

  if (status.includes('released')) return { stage: 'released' as const, label: 'Released' }
  if (status.includes('releasing')) return { stage: 'escrowed' as const, label: 'Processing payout' }
  if (status.includes('funded')) return { stage: 'escrowed' as const, label: 'In escrow' }
  if (status.includes('fully')) return { stage: 'payment-due' as const, label: 'Payment due' }
  if (status.includes('cancel') || status.includes('declin'))
    return { stage: 'signing' as const, label: 'Cancelled' }
  if (
    status.includes('certified') ||
    status.includes('partial') ||
    status.includes('awaitingsign')
  ) {
    return tenantSigned
      ? { stage: 'signing' as const, label: 'Awaiting landlord' }
      : { stage: 'signing' as const, label: 'Awaiting your signature' }
  }
  if (status.includes('legal')) return { stage: 'signing' as const, label: 'Lawyer reviewing' }
  return { stage: 'signing' as const, label: 'In progress' }
}

/**
 * Payments is a read-only ledger.
 *
 * The escrow pay button used to live here, and it was worse than a duplicate: it
 * picked a lease with `leases.find(l => l.status !== 'fullysigned')`, so with more
 * than one tenancy it could charge the WRONG lease — and because
 * 'fundedinescrow' also fails that check it would offer to pay again for a lease
 * already funded. Payment is now initiated in exactly one place, the agreement
 * screen, where the tenant can see the terms and both signatures first.
 */
export function TenantPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [agreements, setAgreements] = useState<AgreementMoney[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    loadWithFallback(
      async () => {
        const rows = await getTransactions(1, 50)
        return rows.map(transactionToPayment)
      },
      [],
    ).then((result) => {
      if (active) {
        setPayments(result.data)
        if (result.error) setLoadError(result.error)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const loadAgreements = useCallback(async () => {
    try {
      const leases = await listCallerLeases(1, 50)
      const withListing = leases.filter(
        (lease) => lease.id && lease.listingId && !String(lease.status ?? '').toLowerCase().includes('cancel'),
      )

      // Listing detail carries the price breakdown, which the lease row does not.
      const details = await Promise.allSettled(
        withListing.map((lease) => getListing(String(lease.listingId))),
      )

      const rows: AgreementMoney[] = withListing.map((lease, index) => {
        const detail = details[index].status === 'fulfilled' ? details[index].value : null
        const rent = detail?.priceAmount ?? 0
        const caution = detail?.cautionFeeAmount ?? 0
        const realHouseFee = detail?.realHouseFeeAmount ?? 0
        const agentFee = detail?.agentFeeAmount ?? 0
        const total = rent + caution + realHouseFee + agentFee
        const stage = readStage(lease)
        return {
          leaseId: String(lease.id),
          title: detail?.title || String((lease as Record<string, unknown>).listingTitle ?? 'Tenancy'),
          location: [detail?.area, detail?.city].filter(Boolean).join(', '),
          total,
          stage: stage.stage,
          stageLabel: stage.label,
          needsTenant: Boolean(pendingActionForLease(lease)),
        }
      })

      // Anything the tenant still owes comes first — a due payment silently buried
      // under a list of tenancies is the same "it vanished" problem as before.
      rows.sort((a, b) => Number(b.needsTenant) - Number(a.needsTenant))
      setAgreements(rows)
    } catch {
      /* the ledger below still renders without the per-agreement summary */
    }
  }, [])

  useEffect(() => {
    void loadAgreements()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void loadAgreements()
    }, 30000)
    return () => clearInterval(timer)
  }, [loadAgreements])

  return (
    <div className="px-[clamp(16px,4vw,40px)]">
      <DataErrorBanner message={loadError} />
      <PageHeading title="Payments & escrow" />
      <div className="mt-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          <div className="space-y-8">
            <div className="rounded-xl border border-sage bg-white p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sage">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-soft text-forest">
                  <LockIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg text-forest">Your tenancies</h3>
              </div>

              {agreements.length === 0 ? (
                <p className="text-sm text-mist leading-relaxed">
                  Once you request an inspection on a property and start a tenancy, it will appear here
                  with its payment status.
                </p>
              ) : (
                <ul className="divide-y divide-sage">
                  {agreements.map((row) => (
                    <li
                      key={row.leaseId}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[15px] text-ink truncate">{row.title}</p>
                        <p className="text-sm text-mist">
                          {row.location ? `${row.location} · ` : ''}
                          {row.total > 0 ? formatPrice(row.total) : 'Amount pending'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <StatusPill
                          tone={
                            row.stage === 'payment-due'
                              ? 'awaiting'
                              : row.stage === 'released'
                                ? 'paid'
                                : row.stage === 'escrowed'
                                  ? 'confirmed'
                                  : 'draft'
                          }
                        >
                          {row.stageLabel}
                        </StatusPill>
                        {/*
                          Navigates to the agreement rather than opening checkout
                          here — payment is started in exactly one place.
                        */}
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/agreement/${row.leaseId}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-forest/30 px-3 py-1.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft"
                        >
                          {row.stage === 'payment-due' ? 'Pay now' : 'View'}
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-sage bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-forest">Escrow Protection</h3>
                <ChevronRightIcon className="w-5 h-5 text-mist" />
              </div>
              <p className="text-sm text-mist leading-relaxed">
                Your funds are held securely in escrow until the lawyer reviews and approves the
                agreement. The landlord only receives payment after the agreement is signed by all
                parties. Caution fee is refundable at the end of the tenancy, subject to inspection.
              </p>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-sage bg-white">
              <div className="px-6 py-4 border-b border-sage">
                <h3 className="font-semibold uppercase tracking-[0.1em] text-[13px] text-forest">
                  PAYMENT HISTORY
                </h3>
              </div>

              <div className="divide-y divide-sage">
                {payments.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-mist">
                    No payments yet. Your escrow package will appear here once funded.
                  </div>
                ) : (
                  payments.map((payment, index) => (
                    <div
                      key={payment.id}
                      className={cn(
                        'px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
                        index === payments.length - 1 ? 'pb-6' : 'pb-4'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[15px] text-ink">{payment.description}</p>
                        <p className="mt-0.5 text-sm text-mist">
                          {payment.propertyLocation ? `${payment.propertyLocation} · ` : ''}
                          {payment.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-semibold text-lg text-ink shrink-0">
                          {formatPrice(payment.amount)}
                        </span>
                        <StatusPill tone={getPaymentStatusBadge(payment.status).tone}>
                          {getPaymentStatusBadge(payment.status).label}
                        </StatusPill>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

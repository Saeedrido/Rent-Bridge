import { useEffect, useState } from 'react'
import { ChevronRightIcon, LockIcon, DataErrorBanner } from '../roleDashboards/shared'
import { PageHeading, StatusPill, cn } from '../roleDashboards/shared'
import { formatPrice } from './tenantUtils'
import { getPaymentStatusBadge, type Payment } from './tenantData'
import { loadWithFallback } from '../../../services/api/fallback'
import { getTransactions } from '../../../services/api/dashboardApi'
import { transactionToPayment } from '../../../services/api/mappers'
import { listCallerLeases, fundEscrow } from '../../../services/api/leaseApi'
import { getListing } from '../../../services/api/listingApi'
import { apiErrorMessage } from '../../../services/api/fallback'
import { useToast } from '../roleDashboards/shared'

const PLATFORM_COMMISSION_RATE = 0.05
const LAWYER_REVIEW_FEE = 45000

interface EscrowSummary {
  leaseId: string
  title: string
  location: string
  rent: number
  caution: number
  legal: number
  commission: number
  total: number
}

export function TenantPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [escrow, setEscrow] = useState<EscrowSummary | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const { show } = useToast()

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

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const leases = await listCallerLeases(1, 50)
        if (!active) return
        const open = leases.find((lease) => {
          const status = (lease.status ?? '').toLowerCase()
          return lease.id && lease.listingId && status !== 'fullysigned' && !status.includes('cancel') && !status.includes('declin')
        })
        const lease = open ?? leases.find((l) => l.id && l.listingId)
        if (!lease?.listingId) return
        const detail = await getListing(lease.listingId).catch(() => null)
        if (!active) return
        const rent = detail?.priceAmount ?? 0
        const caution = detail?.cautionFeeAmount ?? 0
        const commission = Math.round(rent * PLATFORM_COMMISSION_RATE)
        setEscrow({
          leaseId: lease.id,
          title: detail?.title ?? 'Rent package',
          location: [detail?.area, detail?.city].filter(Boolean).join(', '),
          rent,
          caution,
          legal: LAWYER_REVIEW_FEE,
          commission,
          total: rent + commission + LAWYER_REVIEW_FEE + caution,
        })
      } catch {
        /* escrow stays hidden until a tenancy exists */
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const handlePay = async () => {
    if (!escrow) return
    setCheckingOut(true)
    try {
      const res = await fundEscrow(escrow.leaseId)
      const url = res.checkoutUrl ?? res.url
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
        show('Opening secure checkout for your escrow payment.')
      } else {
        show('Checkout is being prepared — check payment history shortly.')
      }
    } catch (err) {
      show(apiErrorMessage(err) || 'Could not start escrow checkout right now.')
    } finally {
      setCheckingOut(false)
    }
  }

  return (
    <div className="px-[clamp(16px,4vw,40px)]">
      <DataErrorBanner message={loadError} />
      <PageHeading title="Payments & escrow" />
      <div className="mt-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          <div className="space-y-8">
            {escrow ? (
              <div className="rounded-xl border border-sage bg-white p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sage">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-soft text-forest">
                    <LockIcon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-forest">Pay your rent into escrow</h3>
                </div>

                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-forest mb-2">
                    {escrow.title}
                    {escrow.location ? ` · ${escrow.location}` : ''}
                  </p>
                  <p className="font-serif text-3xl font-bold text-forest">{formatPrice(escrow.total)}</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-[#374151]">
                    <span>Annual rent</span>
                    <span className="font-semibold text-ink">{formatPrice(escrow.rent)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#374151]">
                    <span>Platform commission (5%)</span>
                    <span className="font-semibold text-ink">{formatPrice(escrow.commission)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#374151]">
                    <span>Legal fee — lawyer review</span>
                    <span className="font-semibold text-ink">{formatPrice(escrow.legal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#374151]">
                    <span>Caution fee (refundable)</span>
                    <span className="font-semibold text-ink">{escrow.caution > 0 ? formatPrice(escrow.caution) : '—'}</span>
                  </div>
                </div>

                <div className="border-t border-sage pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="font-semibold text-lg text-ink">Total package</span>
                    <span className="font-serif text-2xl font-bold text-forest">{formatPrice(escrow.total)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePay}
                  disabled={checkingOut || escrow.total <= 0}
                  className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-6 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-flame-dark disabled:opacity-60"
                >
                  {checkingOut ? 'Preparing checkout…' : 'Pay into Escrow'}
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-sage bg-white p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-sage">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-soft text-forest">
                    <LockIcon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-forest">Pay your rent into escrow</h3>
                </div>
                <p className="text-sm text-mist leading-relaxed">
                  Once you request an inspection on a property and start a tenancy, your rent package
                  (rent + commission + legal fee + caution) will appear here for secure escrow payment.
                </p>
              </div>
            )}

            <div className="rounded-xl border border-sage bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-forest">Escrow Protection</h3>
                <ChevronRightIcon className="w-5 h-5 text-mist" />
              </div>
              <p className="text-sm text-mist leading-relaxed">
                Your funds are held securely in escrow until the lawyer reviews and approves the agreement.
                The landlord only receives payment after the agreement is signed by all parties.
                Caution fee is refundable at the end of the tenancy, subject to inspection.
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
                        <StatusPill
                          tone={getPaymentStatusBadge(payment.status).tone}
                        >
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
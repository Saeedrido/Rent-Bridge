import { useState } from 'react'
import { PaymentsIcon } from '../components/icons'
import { ChevronRightIcon, CalendarIcon, LockIcon } from '../roleDashboards/shared'
import { PageHeading, StatusPill, cn } from '../roleDashboards/shared'
import { formatPrice } from './tenantUtils'
import { tenantPayments, getPaymentStatusBadge, getPaymentTypeLabel, type Payment } from './tenantData'

interface PaymentsPageProps {
  currentProperty?: {
    id: string
    title: string
    location: string
    price: number
  }
}

export function TenantPaymentsPage({ currentProperty }: PaymentsPageProps) {
  const [payments] = useState(tenantPayments)
  const [isPaying, setIsPaying] = useState(false)

  const rentAmount = 1400000
  const commission = Math.round(rentAmount * 0.05)
  const legalFee = 45000
  const cautionFee = 140000
  const totalAmount = rentAmount + commission + legalFee + cautionFee

  const paymentHistory = tenantPayments.filter(p => p.status !== 'awaiting')

  return (
    <div className="px-[clamp(16px,4vw,40px)]">
      <PageHeading title="Payments & escrow" />
      <div className="mt-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          <div className="space-y-8">
            <div className="rounded-xl border border-sage bg-white p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sage">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-soft text-forest">
                  <LockIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg text-forest">Pay your rent into escrow</h3>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-forest mb-2">
                  2-BEDROOM FLAT · SABO, YABA
                </p>
                <p className="font-serif text-3xl font-bold text-forest">{formatPrice(1655000)}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-[#374151]">
                  <span>Annual rent</span>
                  <span className="font-semibold text-ink">{formatPrice(1400000)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#374151]">
                  <span>Platform commission (5%)</span>
                  <span className="font-semibold text-ink">{formatPrice(70000)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#374151]">
                  <span>Legal fee — lawyer review</span>
                  <span className="font-semibold text-ink">{formatPrice(45000)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#374151]">
                  <span>Caution fee (refundable)</span>
                  <span className="font-semibold text-ink">{formatPrice(140000)}</span>
                </div>
              </div>

              <div className="border-t border-sage pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="font-semibold text-lg text-ink">Total package</span>
                  <span className="font-serif text-2xl font-bold text-forest">{formatPrice(1655000)}</span>
                </div>
              </div>

              <button
                className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-6 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-flame-dark"
                disabled={isPaying}
              >
                {isPaying ? 'Processing...' : 'Pay into Escrow'}
              </button>
            </div>

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
                {tenantPayments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className={cn(
                      'px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
                      index === tenantPayments.length - 1 ? 'pb-6' : 'pb-4'
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
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TenantPaymentsPageWithState({ payments: initialPayments }: { payments: typeof tenantPayments }) {
  const [payments] = useState(initialPayments)
  return <TenantPaymentsPage currentProperty={{ id: 'd1', title: '2-bedroom flat, newly serviced', location: 'Sabo, Yaba', price: 1400000 }} />
}
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCallerLeases } from '../../../services/api/leaseApi'
import { AlertCircleIcon, ShieldCheckIcon } from '../components/icons'

type PendingAction = {
  leaseId: string
  kind: 'sign' | 'pay'
  title: string
  detail: string
}

const POLL_MS = 30000

/**
 * Works out whether a lease still needs something from the tenant, and how urgent it
 * is. Kept as a pure function so the banner and the agreement page cannot disagree
 * about what "done" means.
 */
export function pendingActionForLease(lease: {
  status?: string
  signedParties?: unknown
}): PendingAction | null {
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

  // Money has reached the provider — nothing left for the tenant to do.
  if (/funded|releasing|released/.test(status)) return null

  if (status.includes('fully')) {
    return {
      leaseId: '',
      kind: 'pay',
      title: 'Payment due for your signed agreement',
      detail: 'All parties have signed. Complete your payment to hold it in escrow.',
    }
  }

  if (
    (status.includes('certified') ||
      status.includes('partial') ||
      status.includes('awaitingsign')) &&
    !tenantSigned
  ) {
    return {
      leaseId: '',
      kind: 'sign',
      title: 'An agreement is waiting for your signature',
      detail:
        'Your lawyer has finished reviewing it. Sign to continue — payment opens once your landlord signs too.',
    }
  }

  return null
}

/**
 * A standing reminder of unfinished agreement business.
 *
 * Without this, an agreement in progress silently disappears the moment the tenant
 * opens a different property: the property page shows only that property, so the
 * pending agreement looks abandoned even though it is still live. This renders on
 * every tenant surface and links straight back to the agreement.
 */
export function PendingAgreementBanner() {
  const navigate = useNavigate()
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [dismissed, setDismissed] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const leases = await listCallerLeases()
      const actionable = leases
        .map((lease) => {
          const action = pendingActionForLease(lease)
          return action ? { ...action, leaseId: String(lease.id ?? '') } : null
        })
        .filter((entry): entry is PendingAction & { leaseId: string } => Boolean(entry?.leaseId))

      // Most urgent first: an unpaid-but-signed agreement is the one that quietly
      // costs the tenant money, so it outranks a signature request.
      actionable.sort((a, b) => (a.kind === 'pay' ? -1 : 1) - (b.kind === 'pay' ? -1 : 1))
      setPending(actionable[0] ?? null)
    } catch {
      // Never let a failed poll disrupt the page the tenant is actually reading.
      setPending(null)
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [load])

  if (!pending || dismissed === pending.leaseId) return null

  const isPay = pending.kind === 'pay'

  return (
    <div
      role="status"
      className="rounded-xl border border-flame/30 bg-sand p-4 mb-5 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      {isPay ? (
        <ShieldCheckIcon className="w-6 h-6 text-forest shrink-0" />
      ) : (
        <AlertCircleIcon className="w-6 h-6 text-flame shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-forest">{pending.title}</p>
        <p className="text-sm text-mist">{pending.detail}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate(`/dashboard/agreement/${pending.leaseId}`)}
          className="rounded-lg bg-flame px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-flame-dark"
        >
          {isPay ? 'Pay now' : 'Review & sign'}
        </button>
        <button
          onClick={() => setDismissed(pending.leaseId)}
          aria-label="Dismiss reminder"
          className="rounded-lg border border-forest/20 px-3 py-2 text-sm text-mist transition-colors hover:bg-sage-soft"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

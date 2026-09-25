import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui'
import { ROLES } from './roles'
import { currentRoleId, roleDashboardPath } from '../../../utils/roles'
import { verifyKyc, getKycStatus, type KycStatusValue } from '../../../services/api/kycApi'
import { ApiError } from '../../../services/api/client'
import { cn } from '../../../utils/cn'

declare global {
  interface Window {
    Connect?: new (options: Record<string, unknown>) => {
      setup: () => void
      open: () => void
    }
  }
}

const WIDGET_SRC = 'https://widget.dojah.io/widget.js'
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 120000

let widgetScriptPromise: Promise<void> | null = null

function loadWidgetScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.Connect) return Promise.resolve()
  if (!widgetScriptPromise) {
    widgetScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = WIDGET_SRC
      script.async = false
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Unable to load the verification widget.'))
      document.head.appendChild(script)
    })
  }
  return widgetScriptPromise
}

type Stage = 'idle' | 'starting' | 'widget' | 'checking' | 'verified' | 'rejected'

const STEPS = [
  { id: 'start', label: 'Start' },
  { id: 'verify', label: 'Verify' },
  { id: 'confirmed', label: 'Confirmed' },
]

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cn('animate-spin', className)}>
      <circle cx="12" cy="12" r="9" strokeDasharray="40" strokeDashoffset="70" strokeLinecap="round" />
      <path d="M12 3a9 9 0 0 1 9 9" strokeLinecap="round" />
    </svg>
  )
}

function formStateTone(stage: Stage): KycStatusValue {
  if (stage === 'verified') return 'verified'
  if (stage === 'rejected') return 'rejected'
  if (stage === 'widget' || stage === 'checking') return 'pending'
  return 'none'
}

export function KycVerificationPage() {
  const navigate = useNavigate()
  const roleId = currentRoleId()
  const role = ROLES.find((r) => r.id === roleId) ?? ROLES[0]

  const [nin, setNin] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  const connectRef = useRef<{ setup: () => void; open: () => void } | null>(null)
  const pollTimerRef = useRef<number | null>(null)
  const stageRef = useRef<Stage>('idle')
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (pollTimerRef.current !== null) window.clearTimeout(pollTimerRef.current)
    }
  }, [])

  const setStageSafe = useCallback((next: Stage) => {
    stageRef.current = next
    setStage(next)
  }, [])

  const pollStatus = useCallback(async () => {
    const startedAt = Date.now()
    const tick = async (): Promise<void> => {
      if (!mountedRef.current) return
      try {
        const status = await getKycStatus()
        if (status?.status === 'verified') {
          setStageSafe('verified')
          return
        }
        if (status?.status === 'rejected') {
          setStageSafe('rejected')
          return
        }
      } catch {
        /* transient — keep polling */
      }
      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        setNote('Verification is taking longer than expected. Check your dashboard again shortly.')
        setStageSafe('widget')
        return
      }
      pollTimerRef.current = window.setTimeout(tick, POLL_INTERVAL_MS)
    }
    void tick()
  }, [setStageSafe])

  const startVerification = async () => {
    setError('')
    setNote('')
    const cleaned = nin.trim()
    if (!/^\d{11}$/.test(cleaned)) {
      setError('Your NIN must be exactly 11 digits.')
      return
    }

    setStageSafe('starting')
    try {
      const session = await verifyKyc({ nin: cleaned })
      if (
        !session.referenceId ||
        !session.data?.appId ||
        !session.data?.publicKey ||
        !session.data?.widgetId
      ) {
        throw new Error('The verification service did not return a valid session.')
      }

      await loadWidgetScript()
      if (!window.Connect) throw new Error('The verification widget is unavailable right now.')

      const connect = new window.Connect({
        app_id: session.data.appId,
        p_key: session.data.publicKey,
        type: 'custom',
        config: { widget_id: session.data.widgetId },
        reference_id: session.referenceId,
        gov_data: { nin: cleaned },
        onSuccess: () => {
          if (!mountedRef.current) return
          setNote('')
          setStageSafe('checking')
          void pollStatus()
        },
        onError: (err: unknown) => {
          if (!mountedRef.current) return
          setStageSafe('widget')
          setError(
            err instanceof Error
              ? err.message
              : 'Verification failed inside the widget. Please try again.',
          )
        },
        onClose: () => {
          if (!mountedRef.current) return
          if (stageRef.current === 'widget') {
            setNote('You closed the verification window. Reopen it to continue, or start again.')
          }
        },
      })
      connectRef.current = connect
      connect.setup()
      connect.open()
      setStageSafe('widget')
    } catch (err) {
      setStageSafe('idle')
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unable to start verification. Please try again.',
      )
    }
  }

  const reopenWidget = () => {
    setError('')
    setNote('')
    connectRef.current?.setup()
    connectRef.current?.open()
  }

  const returnHome = () => navigate(roleDashboardPath(roleId))

  const statusText: Record<KycStatusValue, string> = {
    none: 'NOT STARTED',
    pending: 'PENDING',
    verified: 'VERIFIED',
    rejected: 'REJECTED',
  }
  const tone = formStateTone(stage)

  return (
    <div className="min-h-screen bg-sand px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mt-6 rounded-card border border-green/20 bg-white p-7 md:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange">{role.label}</p>
              <h1 className="mt-1 font-serif text-4xl font-bold text-green-dark md:text-5xl">
                Verify your identity
              </h1>
              <p className="mt-2 text-sm text-mist">
                We check your details against official records. Takes about 2 minutes.
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold uppercase',
                tone === 'verified'
                  ? 'border-green/30 bg-green/10 text-green'
                  : tone === 'rejected'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : tone === 'pending'
                      ? 'border-orange/30 bg-orange/10 text-orange'
                      : 'border-gray-300 bg-gray-100 text-gray-500',
              )}
            >
              {statusText[tone]}
            </span>
          </div>

          {error && (
            <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          {note && !error && (
            <p className="mt-5 rounded-lg border border-orange/20 bg-orange/5 px-3.5 py-2.5 text-sm font-medium text-orange">
              {note}
            </p>
          )}

          <div className="mt-7 rounded-lg border border-green/15 bg-sand/40 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-green/20 bg-white text-green-dark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
                    <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinejoin="round" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-green-dark">Become a verified user</p>
                  <p className="text-sm text-mist">
                    We open a secure window to capture your NIN and a live selfie.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="kyc-nin" className="mb-1.5 block text-sm font-medium text-green-dark">
                NIN (National Identification Number)
              </label>
              <input
                id="kyc-nin"
                type="text"
                value={nin}
                onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                maxLength={11}
                disabled={stage !== 'idle'}
                autoComplete="off"
                inputMode="numeric"
                placeholder="e.g. 12345678901"
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-[15px] text-ink placeholder:text-gray-400 outline-none transition disabled:opacity-60 focus:border-green focus:ring-2 focus:ring-green/10"
              />
              <p className="mt-2 text-xs text-mist">
                Your 11-digit NIN is pre-filled in the verification window and checked against official records.
              </p>
            </div>

            <div className="mt-5">
              {stage === 'verified' ? (
                <div className="flex items-center gap-2 rounded-lg bg-green/10 px-4 py-3 text-sm font-semibold text-green">
                  <CheckIcon className="h-5 w-5" />
                  You are verified. Your details are confirmed.
                </div>
              ) : stage === 'rejected' ? (
                <div className="space-y-3">
                  <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    Our check could not confirm your identity. You can try again.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={startVerification}>Try again</Button>
                    <Button variant="outline" onClick={returnHome}>
                      Back to dashboard
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                  <Button
                    type="button"
                    onClick={startVerification}
                    disabled={stage === 'starting' || stage === 'checking'}
                    className="shrink-0 sm:w-48"
                  >
                    {stage === 'starting'
                      ? 'Starting…'
                      : stage === 'checking'
                        ? 'Checking…'
                        : 'Start verification'}
                  </Button>
                  {stage === 'widget' && (
                    <Button type="button" variant="outline" onClick={reopenWidget} className="shrink-0">
                      Reopen verification window
                    </Button>
                  )}
                  {stage !== 'idle' && stage !== 'starting' && stage !== 'checking' && stage !== 'widget' && (
                    <Button variant="outline" onClick={returnHome}>
                      Back to dashboard
                    </Button>
                  )}
                </div>
              )}
            </div>

            {(stage === 'widget' || stage === 'checking' || stage === 'starting') && (
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-white p-4 text-[15px] text-green-dark">
                <SpinnerIcon className="h-5 w-5 shrink-0 text-orange" />
                <div>
                  <p className="font-semibold">
                    {stage === 'widget'
                      ? 'Complete the steps in the verification window.'
                      : stage === 'checking'
                        ? 'Confirming your result…'
                        : 'Preparing your verification…'}
                  </p>
                  <p className="text-sm text-mist">
                    {stage === 'widget'
                      ? 'If nothing opened, click "Reopen verification window" above.'
                      : stage === 'checking'
                        ? 'This usually takes up to a minute after you finish the steps.'
                        : 'Setting up your secure session.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-7 flex items-center justify-center gap-2" aria-hidden="true">
            {STEPS.map((step, i) => {
              const stepIndex =
                stage === 'verified'
                  ? STEPS.length
                  : stage === 'widget' || stage === 'checking' || stage === 'starting'
                    ? 1
                    : 0
              const done = i < stepIndex
              const current = i === stepIndex
              return (
                <div key={step.id} className="flex items-center gap-2">
                  {i > 0 && <span className={cn('h-px w-6', done ? 'bg-green' : 'bg-gray-300')} />}
                  <span
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                      done && 'bg-green/10 text-green',
                      current && 'bg-orange text-white',
                      !done && !current && 'bg-gray-100 text-gray-400',
                    )}
                  >
                    {done && <CheckIcon className="h-3 w-3" />}
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {stage === 'verified' && (
            <div className="mt-7">
              <Button size="lg" fullWidth onClick={returnHome}>
                Continue to dashboard
              </Button>
              <p className="mt-3 text-center text-sm text-mist">
                Your NIN is checked against official records and never shown to other users.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default KycVerificationPage
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { getKycStatus, type KycStatusValue } from '../../../services/api/kycApi'
import { cn } from '../../../utils/cn'

export { cn }

export function formatPrice(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

/* ---------------------------------- icons --------------------------------- */

interface IconProps {
  className?: string
}

const iconBase = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className} width={18} height={18}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className} width={16} height={16}>
      <path d="M20 10c0 5.5-8 11-8 11s-8-5.5-8-11a8 8 0 1 1 16 0z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  )
}

export function ShieldCheckIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" />
      <path d="M9 12l2.2 2.2L15.5 9.7" />
    </svg>
  )
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className} width={16} height={16}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className} width={16} height={16}>
      <path d="M12 4v11m0 0 4-4m-4 4-4-4" />
      <path d="M5 19h14" />
    </svg>
  )
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className} width={16} height={16}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className} width={16} height={16}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className} width={20} height={20}>
      <path d="M6 10h16M6 14h16M6 18h8" />
      <rect x="4" y="4" width="16" height="18" rx="2" />
    </svg>
  )
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export function AlertCircleIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  )
}

export function FileSearchIcon({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M13 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8l-5-5z" />
      <path d="M13 3v5h5" />
      <circle cx="11.5" cy="13.5" r="2.5" />
      <path d="m13.5 15.5 2 2" />
    </svg>
  )
}

/* --------------------------- data error banner ---------------------------- */

export function DataErrorBanner({ message }: { message: string | null }) {
  const navigate = useNavigate()
  if (!message) return null
  const isIdentity = message.length < 400 && /(\bidentity\b|\bverif\w*|\bkyc\b|\bnin\b)/i.test(message)
  const title = isIdentity ? 'Live data is blocked' : 'Live data unavailable'
  const body = isIdentity
    ? `${message}. Complete identity verification (KYC) to unlock live data.`
    : 'The server could not load live data right now. Please try again later.'
  return (
    <div className="mb-6 rounded-xl border border-[#E4C7C7] bg-[#FDF3F3] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-[#B42318]">{title}</p>
          <p className="mt-1 text-sm text-[#7A271A]">{body}</p>
        </div>
        {isIdentity ? (
          <button
            type="button"
            onClick={() => navigate('/kyc-verification')}
            className="shrink-0 rounded-lg bg-[#B42318] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#912018]"
          >
            Complete KYC
          </button>
        ) : (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="shrink-0 rounded-lg border border-[#B42318]/30 bg-white px-4 py-2 text-sm font-semibold text-[#B42318] transition-colors hover:bg-[#FDF3F3]"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------- status pill ------------------------------ */

export type PillTone =
  | 'inreview'
  | 'waiting'
  | 'signed'
  | 'published'
  | 'unpublished'
  | 'pending'
  | 'confirmed'
  | 'declined'
  | 'draft'
  | 'withlawyer'
  | 'paid'
  | 'neutral'
  | 'awaiting'
  | 'refunded'
  | 'failed'

const pillTones: Record<PillTone, string> = {
  inreview: 'bg-flame-soft text-[#B34708]',
  waiting: 'bg-[#EDEFF2] text-[#495057]',
  signed: 'bg-[#E2EFE6] text-forest',
  published: 'bg-forest text-white',
  unpublished: 'bg-[#3F4753]/90 text-white',
  pending: 'bg-[#EDEFF2] text-[#495057]',
  confirmed: 'bg-[#E2EFE6] text-forest',
  declined: 'bg-[#EDEFF2] text-[#8A929C]',
  draft: 'bg-[#EDEFF2] text-[#495057]',
  withlawyer: 'bg-flame-soft text-[#B34708]',
  paid: 'bg-[#E2EFE6] text-forest',
  neutral: 'bg-[#EDEFF2] text-[#495057]',
  awaiting: 'bg-flame-soft text-[#B34708]',
  refunded: 'bg-[#E2EFE6] text-forest',
  failed: 'bg-[#FDE8E8] text-[#B42318]',
}

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: PillTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.07em]',
        pillTones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ---------------------------------- toasts -------------------------------- */

interface ToastItem {
  id: number
  message: string
}

interface ToastContextValue {
  show: (message: string) => void
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev.slice(-2), { id, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3400)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-6 z-[220] flex flex-col items-center gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-toast pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-lg bg-forest-deep px-4 py-3 text-sm font-medium text-white shadow-lg"
          >
            <svg {...iconBase} width={16} height={16} className="shrink-0 text-[#8FD6AE]" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/* ---------------------------------- modal --------------------------------- */

export function DashboardModal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="anim-fade fixed inset-0 z-[200] flex items-end justify-center bg-[#101828]/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={cn(
          'anim-rise max-h-[92vh] w-full overflow-auto rounded-t-2xl bg-white shadow-xl sm:rounded-xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-sage-line px-6 py-4">
            <h2 className="font-serif text-xl font-semibold text-forest">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full text-mist transition-colors hover:bg-sand hover:text-ink"
            >
              <CloseIcon />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

/* ----------------------------- form primitives ---------------------------- */

export const inputClass =
  'w-full rounded-lg border border-sage bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-mist/80 transition-colors focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15'

export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#374151]">
        {label}
        {required && <span className="text-flame"> *</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[13px] font-medium text-[#B42318]">{error}</span>}
    </label>
  )
}

/* ------------------------------ page heading ------------------------------ */

export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold leading-tight tracking-[-0.01em] text-forest md:text-[40px] md:leading-[1.15]">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-[15px] text-mist">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* -------------------------------- empty state ------------------------------ */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-sage bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage-soft text-forest">
        {icon}
      </div>
      <h3 className="mt-4 font-serif text-xl font-semibold text-forest">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-[15px] text-mist">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

/* ------------------------------- profile section ---------------------------- */

export interface ProfileData {
  name: string
  email: string
  phone: string
}

export function ProfileSection({
  initial,
  verifiedLabel,
  onSave,
  verification = true,
}: {
  initial: ProfileData
  verifiedLabel: string
  onSave: (data: ProfileData) => void
  verification?: boolean
}) {
  const { show } = useToast()
  const [edit, setEdit] = useState(false)
  const [draft, setDraft] = useState(initial)

  const handleSave = () => {
    onSave(draft)
    setEdit(false)
    show('Profile updated')
  }

  return (
    <div className="max-w-xl space-y-8">
      <div className="rounded-xl border border-sage bg-white p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-start sm:text-left sm:gap-6">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sage-soft font-serif text-2xl font-bold text-forest">
            {draft.name.charAt(0)}
          </span>
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink">{draft.name}</h2>
            <p className="mt-0.5 text-sm text-mist">{draft.email}</p>
            <p className="text-sm text-mist">{draft.phone}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={inputClass}
              disabled={!edit}
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className={inputClass}
              disabled={!edit}
            />
          </Field>
          <Field label="Phone" required>
            <input
              type="tel"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              className={inputClass}
              disabled={!edit}
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end">
          {edit ? (
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark"
            >
              Save changes
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEdit(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-forest/30 bg-white px-5 py-2.5 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft"
            >
              Edit profile
            </button>
          )}
        </div>
      </div>

      {verification && <VerificationCard verifiedLabel={verifiedLabel} />}
    </div>
  )
}

/* ----------------------------- verification card --------------------------- */

export function VerificationCard({ verifiedLabel }: { verifiedLabel?: string }) {
  const navigate = useNavigate()
  const [state, setState] = useState<'loading' | KycStatusValue>('loading')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const status = await getKycStatus()
        if (active) setState(status?.status ?? 'none')
      } catch {
        if (active) setState('none')
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const title =
    state === 'verified'
      ? 'Identity verified'
      : state === 'pending'
        ? 'Verification in progress'
        : 'Identity verification'

  const subtext =
    state === 'verified'
      ? `${verifiedLabel ? `${verifiedLabel} · ` : ''}KYC completed`
      : state === 'pending'
        ? 'Our check is still running. This can take a few minutes.'
        : state === 'rejected'
          ? 'Your previous verification was not confirmed. You can try again.'
          : 'Verify your NIN and identity to unlock the full platform.'

  const actionLabel =
    state === 'none'
      ? 'Make verification'
      : state === 'pending'
        ? 'Continue verification'
        : state === 'rejected'
          ? 'Retry verification'
          : null

  return (
    <div className="rounded-xl border border-sage bg-white p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage-soft">
          <ShieldCheckIcon className="text-forest" />
        </div>
        <div className="flex-1 pt-1">
          <h3 className="font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-sm text-mist">{subtext}</p>
          {state === 'loading' ? (
            <StatusPill tone="pending" className="mt-3">
              Checking…
            </StatusPill>
          ) : actionLabel ? (
            <button
              type="button"
              onClick={() => navigate('/kyc-verification')}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-flame-dark"
            >
              {actionLabel}
            </button>
          ) : (
            <StatusPill tone="signed" className="mt-3">
              Verified
            </StatusPill>
          )}
        </div>
      </div>
    </div>
  )
}

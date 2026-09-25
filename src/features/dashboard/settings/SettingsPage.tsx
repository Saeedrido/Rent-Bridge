import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Seo } from '../../../components/common'
import { getUser } from '../../../services/api/tokens'
import {
  ProfileIcon,
  BellIcon,
  ShieldCheckIcon,
  SettingsIcon,
  PaymentsIcon,
  HomeIcon,
  InspectionsIcon,
  AgreementIcon,
  CheckIcon,
  LogOutIcon,
} from '../components/icons'
import {
  PageHeading,
  ProfileSection,
  Field,
  inputClass,
  useToast,
  cn,
} from '../roleDashboards/shared'
import { RoleDashboardShell, type NotificationItem } from '../roleDashboards/RoleDashboardShell'
import { PayoutAccountSection } from '../roleDashboards/PayoutAccountSection'
import { listCallerLeases } from '../../../services/api/leaseApi'
import { leaseToInspectionRequest } from '../../../services/api/mappers'
import { refreshProfile, logoutUser } from '../../../services/api/authApi'

export type SettingsRole = 'landlord' | 'caretaker' | 'lawyer' | 'admin' | 'tenant' | 'agent'

export interface SettingsUser {
  name: string
  email: string
  phone: string
}

type SectionId = 'account' | 'notifications' | 'security' | 'preferences' | 'payout'

/* ------------------------------ primitives -------------------------------- */

function SectionCard({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className="rounded-xl border border-sage bg-white p-6 sm:p-8">
      <h2 className="font-serif text-xl font-semibold text-forest">{title}</h2>
      {description && <p className="mt-1 text-sm text-mist">{description}</p>}
      <div className="mt-6">{children}</div>
      {footer && <div className="mt-6 border-t border-sage pt-5">{footer}</div>}
    </section>
  )
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30',
        checked ? 'bg-forest' : 'bg-sage',
      )}
    >
      <span
        className={cn(
          'absolute h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200',
          checked ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <li className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-sm text-mist">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </li>
  )
}

/* ---------------------------- notifications ------------------------------ */

function NotificationsSection() {
  const { show } = useToast()
  const [prefs, setPrefs] = useState({
    inspections: true,
    payments: true,
    agreements: true,
    lawyer: true,
    marketing: false,
    sms: false,
  })

  const toggle = (key: keyof typeof prefs, next: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: next }))
    show('Notification preferences saved')
  }

  return (
    <SectionCard
      title="Notifications"
      description="Choose what reaches your inbox, phone and dashboard."
    >
      <ul className="divide-y divide-sage">
        <ToggleRow
          label="Inspection requests"
          description="A tenant books, confirms or reschedules a viewing."
          checked={prefs.inspections}
          onChange={(next) => toggle('inspections', next)}
        />
        <ToggleRow
          label="Payments & payouts"
          description="Rent received, escrow released or a payout is on the way."
          checked={prefs.payments}
          onChange={(next) => toggle('payments', next)}
        />
        <ToggleRow
          label="Agreement updates"
          description="Status changes across draft, lawyer review and signature."
          checked={prefs.agreements}
          onChange={(next) => toggle('agreements', next)}
        />
        <ToggleRow
          label="Lawyer feedback"
          description="Notes, flags and proposed edits on your tenancy agreement."
          checked={prefs.lawyer}
          onChange={(next) => toggle('lawyer', next)}
        />
        <ToggleRow
          label="SMS alerts"
          description="Time-sensitive events sent to your phone number."
          checked={prefs.sms}
          onChange={(next) => toggle('sms', next)}
        />
        <ToggleRow
          label="Product news"
          description="Occasional updates about new Rent Bridge features."
          checked={prefs.marketing}
          onChange={(next) => toggle('marketing', next)}
        />
      </ul>
    </SectionCard>
  )
}

/* ------------------------------- security -------------------------------- */

function detectDevice(): { device: string; place: string; when: string } {
  try {
    const ua = navigator.userAgent
    const isFirefox = /Firefox/.test(ua)
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua)
    const browser = isFirefox ? 'Firefox' : isSafari ? 'Safari' : 'Chrome'
    const isWindows = /Windows/.test(ua)
    const isMac = /Mac/.test(ua)
    const isIOS = /iPhone|iPad/.test(ua)
    const isAndroid = /Android/.test(ua)
    const os = isWindows ? 'Windows' : isMac ? 'macOS' : isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop'
    return { device: `${browser} on ${os}`, place: 'This device', when: 'Active now' }
  } catch {
    return { device: 'Current device', place: 'This device', when: 'Active now' }
  }
}

function SecuritySection() {
  const { show } = useToast()
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [twoFa, setTwoFa] = useState(true)
  const [dangerArmed, setDangerArmed] = useState(false)
  const [currentDevice] = useState(detectDevice)

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pw.current || !pw.next) {
      show('Enter your current and new password.')
      return
    }
    if (pw.next !== pw.confirm) {
      show('New passwords do not match.')
      return
    }
    setPw({ current: '', next: '', confirm: '' })
    show('Password updated')
  }

  const signOutSession = () => {
    show('Only the current session is available')
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Change password" description="Use at least 8 characters with a mix of letters and numbers.">
        <form onSubmit={handlePasswordSubmit} className="grid max-w-xl gap-4">
          <Field label="Current password" required>
            <input
              type="password"
              autoComplete="current-password"
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
              className={inputClass}
              placeholder="••••••••"
            />
          </Field>
          <Field label="New password" required>
            <input
              type="password"
              autoComplete="new-password"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
              className={inputClass}
              placeholder="••••••••"
            />
          </Field>
          <Field label="Confirm new password" required>
            <input
              type="password"
              autoComplete="new-password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              className={inputClass}
              placeholder="••••••••"
            />
          </Field>
          <div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark"
            >
              Update password
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Two-factor authentication">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Require a code at sign-in</p>
            <p className="mt-0.5 text-sm text-mist">
              We send a one-time code to your phone whenever a new device signs in.
            </p>
          </div>
          <Switch checked={twoFa} onChange={(next) => { setTwoFa(next); show(next ? 'Two-factor authentication on' : 'Two-factor authentication off') }} label="Two-factor authentication" />
        </div>
      </SectionCard>

      <SectionCard title="Active sessions" description="Devices currently signed in to your account.">
        <ul className="space-y-3">
          {[currentDevice].map((session) => (
            <li
              key={session.device}
              className="flex flex-col gap-3 rounded-lg border border-sage bg-sage-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <ShieldCheckIcon className="mt-0.5 text-forest" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {session.device}
                    <span className="ml-2 text-xs font-bold uppercase tracking-[0.07em] text-forest">This device</span>
                  </p>
                  <p className="mt-0.5 text-sm text-mist">
                    {session.place} · {session.when}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => signOutSession()}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-forest/30 bg-white px-3.5 py-2 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft"
              >
                <LogOutIcon className="h-4 w-4" />
                Sign out
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-mist">Other devices that sign in will appear here.</p>
      </SectionCard>

      <section className="rounded-xl border border-[#F0C9C9] bg-[#FDF3F3] p-6 sm:p-8">
        <h2 className="font-serif text-xl font-semibold text-[#B42318]">Danger zone</h2>
        <p className="mt-1 text-sm text-[#7A271A]">
          Deactivating hides your listings and pauses all notifications. This can be reversed by signing in again.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (dangerArmed) {
                setDangerArmed(false)
                show('Account deactivated')
              } else {
                setDangerArmed(true)
              }
            }}
            onBlur={() => setDangerArmed(false)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#B42318]/40 bg-white px-5 py-2.5 text-[15px] font-semibold text-[#B42318] transition-colors hover:bg-[#FDF3F3]"
          >
            {dangerArmed ? 'Tap again to confirm' : 'Deactivate account'}
          </button>
          {dangerArmed && <span className="text-sm font-medium text-[#7A271A]">This will sign you out immediately.</span>}
        </div>
      </section>
    </div>
  )
}

/* ------------------------------ preferences ------------------------------ */

function PreferencesSection() {
  const { show } = useToast()
  const [prefs, setPrefs] = useState({
    currency: 'NGN — Nigerian Naira',
    language: 'English (Nigeria)',
    timezone: 'Africa/Lagos (GMT+1)',
    dateFormat: 'DD MMM YYYY',
  })

  const rows: { key: keyof typeof prefs; label: string; options: string[] }[] = [
    { key: 'currency', label: 'Currency', options: ['NGN — Nigerian Naira', 'USD — US Dollar', 'GBP — Pound Sterling', 'EUR — Euro'] },
    { key: 'language', label: 'Language', options: ['English (Nigeria)', 'English (US)', 'Yoruba', 'Hausa'] },
    { key: 'timezone', label: 'Time zone', options: ['Africa/Lagos (GMT+1)', 'Africa/Accra (GMT)', 'Europe/London (GMT)'] },
    { key: 'dateFormat', label: 'Date format', options: ['DD MMM YYYY', 'YYYY-MM-DD', 'MMM DD, YYYY'] },
  ]

  return (
    <SectionCard
      title="Preferences"
      description="How money, dates and language appear across your dashboard."
      footer={
        <button
          type="button"
          onClick={() => show('Preferences saved')}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-flame px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark"
        >
          <CheckIcon />
          Save preferences
        </button>
      }
    >
      <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
        {rows.map(({ key, label, options }) => (
          <Field key={key} label={label}>
            <select
              value={prefs[key]}
              onChange={(e) => setPrefs({ ...prefs, [key]: e.target.value })}
              className={inputClass}
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        ))}
      </div>
    </SectionCard>
  )
}

/* ----------------------------- settings shell ---------------------------- */

export function SettingsContent({
  role,
  user,
  verifiedLabel = '',
  onProfileSave,
}: {
  role: SettingsRole
  user: SettingsUser
  verifiedLabel?: string
  onProfileSave?: (data: SettingsUser) => void
}) {
  const [section, setSection] = useState<SectionId>('account')
  const [loggingOut, setLoggingOut] = useState(false)
  const navigate = useNavigate()
  const { show } = useToast()

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logoutUser()
      show('You have been signed out.')
    } finally {
      navigate('/login')
    }
  }

  const sections: { id: SectionId; label: string; Icon: (props: { className?: string }) => ReactNode }[] = [
    { id: 'account', label: 'Profile & account', Icon: ProfileIcon },
    { id: 'notifications', label: 'Notifications', Icon: BellIcon },
    { id: 'security', label: 'Security & privacy', Icon: ShieldCheckIcon },
    { id: 'preferences', label: 'Preferences', Icon: SettingsIcon },
    ...(role === 'landlord' || role === 'caretaker'
      ? [{ id: 'payout' as SectionId, label: 'Payout details', Icon: PaymentsIcon }]
      : []),
  ]

  return (
    <>
      <PageHeading
        title="Settings"
        subtitle="Manage your profile, security, notifications and preferences in one place."
      />
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="lg:sticky lg:top-36">
          <ul className="flex gap-1 overflow-x-auto no-scrollbar lg:flex-col lg:overflow-visible">
            {sections.map(({ id, label, Icon }) => {
              const isActive = id === section
              return (
                <li key={id} className="shrink-0">
                  <button
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setSection(id)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200',
                      isActive
                        ? 'bg-forest text-white'
                        : 'text-mist hover:bg-sage-soft hover:text-forest',
                    )}
                  >
                    <Icon className={isActive ? 'text-white' : 'text-mist'} />
                    {label}
                  </button>
                </li>
              )
            })}
            <li className="shrink-0 pt-4 lg:mt-4 lg:border-t lg:border-sage">
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center gap-3 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold text-[#B42318] transition-colors duration-200 hover:bg-[#FDE8E8] disabled:opacity-60"
              >
                <LogOutIcon />
                {loggingOut ? 'Signing out…' : 'Log out'}
              </button>
            </li>
          </ul>
        </nav>

        <div className="min-w-0" key={section}>
          <div className="anim-rise space-y-6">
            {section === 'account' && (
              <ProfileSection
                initial={user}
                verifiedLabel={verifiedLabel}
                verification={role !== 'admin'}
                onSave={(data) => onProfileSave?.(data)}
              />
            )}
            {section === 'notifications' && <NotificationsSection />}
            {section === 'security' && <SecuritySection />}
            {section === 'preferences' && <PreferencesSection />}
            {section === 'payout' && (
              <div className="max-w-2xl">
                <PayoutAccountSection />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/* ------------------- route-based settings page (role shell) --------------- */

export function SettingsPage({ role }: { role: 'landlord' | 'caretaker' }) {
  const navigate = useNavigate()
  const authUser = getUser()
  const [user, setUser] = useState<SettingsUser>({
    name:
      authUser?.name ||
      [authUser?.firstName, authUser?.lastName].filter(Boolean).join(' ') ||
      authUser?.email?.split('@')[0] ||
      (role === 'landlord' ? 'Landlord' : 'Caretaker'),
    email: authUser?.email || '',
    phone: authUser?.phone || '',
  })
  const [verifiedLabel, setVerifiedLabel] = useState(
    authUser?.verified === true
      ? `Verified ${role === 'landlord' ? 'Landlord' : 'Caretaker'}`
      : role === 'landlord' ? 'Landlord' : 'Caretaker',
  )
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

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
      setVerifiedLabel(
        profile.verified === true
          ? `Verified ${role === 'landlord' ? 'Landlord' : 'Caretaker'}`
          : role === 'landlord' ? 'Landlord' : 'Caretaker',
      )
    })
    listCallerLeases(1, 50)
      .then((leases) => {
        if (!active) return
        setNotifications(
          leases
            .map(leaseToInspectionRequest)
            .filter((i) => i.status === 'pending')
            .map((i) => ({
              id: `notif-${i.id}`,
              text: `${i.tenant} requested an inspection of your property.`,
              time: 'New',
            })),
        )
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [role])

  const base = role === 'landlord' ? '/dashboard/landlord' : '/dashboard/caretaker'
  const tabs = [
    { id: 'properties', label: 'My properties', Icon: HomeIcon },
    { id: 'inspections', label: 'Inspections', Icon: InspectionsIcon },
    { id: 'agreement', label: 'Agreement', Icon: AgreementIcon },
    { id: 'payments', label: 'Payments', Icon: PaymentsIcon },
  ]

  return (
    <>
      <Seo title="Settings · Rent Bridge" description="Manage your Rent Bridge account settings" />
      <RoleDashboardShell
        user={{ name: user.name, verifiedLabel, notificationCount: notifications.length }}
        notifications={notifications}
        tabs={tabs}
        active="settings"
        onChange={(id) => navigate(id === 'settings' || id === 'properties' ? base : `${base}/${id}`)}
        settingsTo={`${base}/settings`}
      >
        <SettingsContent
          role={role}
          user={user}
          verifiedLabel={verifiedLabel}
          onProfileSave={setUser}
        />
      </RoleDashboardShell>
    </>
  )
}

import { useState, type ComponentType, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../../../components/common/Logo'
import { cn } from '../../../utils/cn'
import { BellIcon, CheckIcon } from '../components/icons'
import { ToastProvider } from './shared'

export interface NavTab {
  id: string
  label: string
  Icon: ComponentType<{ className?: string }>
}

export interface ShellUser {
  name: string
  verifiedLabel: string
  notificationCount: number
}

export interface NotificationItem {
  id: string
  text: string
  time: string
}

function NotificationBell({ count, items }: { count: number; items: NotificationItem[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications (${count})`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-forest transition-colors hover:bg-sage-soft"
      >
        <BellIcon />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-flame px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="anim-rise absolute right-0 top-full z-[70] mt-2 w-[min(21rem,calc(100vw-2rem))] rounded-xl border border-sage bg-white p-2 shadow-lg">
            <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-[0.07em] text-mist">
              Notifications
            </p>
            {items.map((n) => (
              <div key={n.id} className="flex gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-sand">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage-soft text-forest">
                  <CheckIcon />
                </span>
                <div>
                  <p className="text-sm leading-snug text-ink">{n.text}</p>
                  <p className="mt-0.5 text-xs text-mist">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function RoleDashboardShell({
  user,
  notifications,
  tabs,
  active,
  onChange,
  settingsTo,
  children,
}: {
  user: ShellUser
  notifications: NotificationItem[]
  tabs: NavTab[]
  active: string
  onChange: (id: string) => void
  settingsTo?: string
  children: ReactNode
}) {
  const navigate = useNavigate()
  const openSettings = () => {
    if (settingsTo) navigate(settingsTo)
    else onChange('settings')
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-sand">
        <header className="fixed left-0 right-0 top-0 z-50 bg-white">
          <div className="w-full px-[clamp(16px,4vw,40px)]">
            {/* Top row: Large logo left, notification + profile right */}
            <div className="flex h-[72px] items-center justify-between">
              <Link to="/" className="flex shrink-0 items-center" aria-label="Rent Bridge home">
                <Logo className="h-[110px] w-auto md:h-[170px] md:max-h-[170px] object-contain" />
              </Link>

              <div className="flex items-center gap-4">
                <NotificationBell count={user.notificationCount} items={notifications} />

                <button
                  type="button"
                  onClick={openSettings}
                  className="flex cursor-pointer items-center gap-3 rounded-full transition-colors hover:bg-sand/70"
                  aria-label="Open settings"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-soft text-sm font-semibold text-forest">
                    {user.name.charAt(0)}
                  </div>
                  <div className="leading-tight hidden sm:block">
                    <div className="text-sm font-semibold text-forest">{user.name}</div>
                    <div className="flex items-center gap-1 text-xs text-mist">
                      <CheckIcon className="text-forest" />
                      {user.verifiedLabel}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Navigation row - full width, left-aligned, horizontally scrollable on mobile */}
            <nav className="border-t border-sage no-scrollbar overflow-x-auto" aria-label="Dashboard sections">
              <ul className="flex min-w-max items-stretch gap-1 flex-nowrap">
                {tabs.map(({ id, label, Icon }) => {
                  const isActive = id === active
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => onChange(id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors shrink-0',
                          isActive
                            ? 'border-flame text-forest'
                            : 'border-transparent text-mist hover:text-forest',
                        )}
                      >
                        <Icon className={isActive ? 'text-flame' : 'text-mist'} />
                        {label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        </header>

        <main className="px-[clamp(16px,4vw,40px)] pb-20 pt-[126px] md:pt-[128px]">
          <div key={active} className="anim-rise">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
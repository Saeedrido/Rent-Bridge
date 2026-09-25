import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Logo } from '../../../components/common/Logo'
import { BellIcon, CheckIcon, HomeIcon, SavedIcon, InspectionsIcon, AgreementIcon, PaymentsIcon } from './icons'
import { cn } from '../../../utils/cn'
import { getUser } from '../../../services/api/tokens'
import { refreshProfile } from '../../../services/api/authApi'
import { listCallerLeases } from '../../../services/api/leaseApi'

export function DashboardHeader() {
  const [user, setUser] = useState({ name: '', role: 'tenant' })
  const [notificationCount, setNotificationCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<string>('home')

  const tabs = [
    { id: 'home', label: 'Home', Icon: HomeIcon },
    { id: 'saved', label: 'Saved', Icon: SavedIcon },
    { id: 'inspections', label: 'Inspections', Icon: InspectionsIcon },
    { id: 'agreement', label: 'Agreement', Icon: AgreementIcon },
    { id: 'payments', label: 'Payments', Icon: PaymentsIcon },
  ]

  useEffect(() => {
    const storedName = sessionStorage.getItem('rb:username')
    const storedRole = sessionStorage.getItem('rb:role')
    const auth = getUser()
    setUser({
      name: storedName || auth?.name || auth?.email?.split('@')[0] || '',
      role: storedRole || auth?.role?.toLowerCase() || 'tenant',
    })
    refreshProfile().then((profile) => {
      if (profile) {
        setUser((prev) => ({
          name: profile.name || prev.name,
          role: profile.role ? profile.role.toLowerCase() : prev.role,
        }))
      }
    })
  }, [])

  useEffect(() => {
    let active = true
    listCallerLeases(1, 100)
      .then((leases) => {
        if (!active) return
        const pending = leases.filter((lease) => {
          const status = (lease.status ?? '').toLowerCase()
          return lease.id && !status.includes('fully') && !status.includes('cancel') && !status.includes('declin')
        }).length
        setNotificationCount(pending)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const path = location.pathname.replace('/dashboard', '') || '/'
    if (path === '/') setActiveTab('home')
    else if (path === '/saved') setActiveTab('saved')
    else if (path === '/inspections') setActiveTab('inspections')
    else if (path === '/agreement') setActiveTab('agreement')
    else if (path === '/payments') setActiveTab('payments')
    else if (path.endsWith('/settings')) setActiveTab('')
  }, [location])

  const openSettings = () => {
    navigate(user.role === 'agent' ? '/dashboard/agent/settings' : '/dashboard/settings')
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-sage bg-white/95 backdrop-blur">
      {/* Full-width header - no max-width container */}
      <div className="w-full px-[clamp(16px,4vw,40px)]">
        {/* Top row: Large logo left, notification + profile right */}
        <div className="flex h-[72px] items-center justify-between">
          <Link to="/" className="flex shrink-0 items-center" aria-label="Rent Bridge home">
            <Logo className="h-[110px] w-auto md:h-[170px] md:max-h-[170px] object-contain" />
          </Link>

          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-forest transition-colors hover:bg-sage-soft"
            >
              <BellIcon />
              {notificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-flame px-1 text-[10px] font-bold text-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={openSettings}
              aria-label="Open settings"
              className="flex cursor-pointer items-center gap-3 rounded-full transition-colors hover:bg-sage-soft"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-soft text-sm font-semibold text-forest">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="leading-tight hidden sm:block">
                <div className="text-sm font-semibold text-forest">{user.name || 'User'}</div>
                <div className="flex items-center gap-1 text-xs text-mist">
                  <CheckIcon className={user.role === 'tenant' ? 'text-forest' : 'text-flame'} />
                  {user.role}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Navigation row - full width, left-aligned, horizontally scrollable on mobile */}
        <nav className="no-scrollbar overflow-x-auto" aria-label="Dashboard sections">
          <ul className="flex min-w-max items-stretch gap-1 flex-nowrap">
            {tabs.map(({ id, label, Icon }) => {
              const isActive = activeTab === id
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(id)
                      navigate(`/dashboard${id === 'home' ? '' : `/${id}`}`)
                    }}
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
  )
}
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Logo } from '../../../components/common/Logo'
import { BellIcon, CheckIcon, HomeIcon, SavedIcon, InspectionsIcon, AgreementIcon, PaymentsIcon, ProfileIcon } from './icons'
import { cn } from '../../../utils/cn'

export function DashboardHeader() {
  const [user, setUser] = useState({ name: 'User', role: 'tenant' })
  const navigate = useNavigate()
  const location = useLocation()
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('home')

  const tabs = [
    { id: 'home', label: 'Home', Icon: HomeIcon },
    { id: 'saved', label: 'Saved', Icon: SavedIcon },
    { id: 'inspections', label: 'Inspections', Icon: InspectionsIcon },
    { id: 'agreement', label: 'Agreement', Icon: AgreementIcon },
    { id: 'payments', label: 'Payments', Icon: PaymentsIcon },
    { id: 'profile', label: 'Profile', Icon: ProfileIcon },
  ]

  useEffect(() => {
    const storedName = sessionStorage.getItem('rb:username')
    const storedRole = sessionStorage.getItem('rb:role')
    if (storedRole) {
      setUser({ name: storedName || 'User', role: storedRole })
    }
  }, [])

  useEffect(() => {
    const path = location.pathname.replace('/dashboard', '') || '/'
    if (path === '/') setActiveTab('home')
    else if (path === '/saved') setActiveTab('saved')
    else if (path === '/inspections') setActiveTab('inspections')
    else if (path === '/agreement') setActiveTab('agreement')
    else if (path === '/payments') setActiveTab('payments')
    else if (path === '/profile') setActiveTab('profile')
  }, [location])

  const handleLogout = () => {
    sessionStorage.removeItem('rb:role')
    sessionStorage.removeItem('rb:username')
    navigate('/role-selection')
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
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-flame px-1 text-[10px] font-bold text-white">
                3
              </span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-soft text-sm font-semibold text-forest cursor-pointer"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="leading-tight hidden sm:block">
                <div className="text-sm font-semibold text-forest">{user.name || 'User'}</div>
                <div className="flex items-center gap-1 text-xs text-mist">
                  <CheckIcon className={user.role === 'tenant' ? 'text-forest' : 'text-flame'} />
                  {user.role}
                </div>
              </div>
            </div>

            {showDropdown && (
              <div className="absolute right-0 w-32 mt-4 bg-white rounded-lg border border-sage p-4 shadow-lg z-50 min-w-48">
                <button onClick={handleLogout} className="w-full text-left text-sm text-flame mb-4 underline">
                  Logout
                </button>
              </div>
            )}
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
import { useEffect, useMemo, useState } from 'react'
import { Seo } from '../../components/common'
import type { DashboardProperty } from '../../features/dashboard/data/dashboardProperties'
import { SearchFilters } from '../../features/dashboard/components/SearchFilters'
import { PropertyGrid } from '../../features/dashboard/components/PropertyGrid'
import { TenantInspectionsPage } from '../../features/dashboard/tenant/TenantInspectionsPage2'
import { TenantPaymentsPage } from '../../features/dashboard/tenant/TenantPaymentsPage'
import { TenantSavedPage } from '../../features/dashboard/tenant/TenantSavedPage'
import { getAgreementStatus, type SavedProperty, type TenantAgreement } from './tenant/tenantData'
import { useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { StatusPill, ToastProvider, VerificationCard, DataErrorBanner } from '@/features/dashboard/roleDashboards/shared'
import { propertyService } from '../../features/properties/services/propertyService'
import { propertyToDashboardProperty, leaseToTenantAgreement } from '../../services/api/mappers'
import { listCallerLeases } from '../../services/api/leaseApi'
import { loadWithFallback, apiErrorMessage } from '../../services/api/fallback'
import { getUser } from '../../services/api/tokens'
import { refreshProfile } from '../../services/api/authApi'
import { useFavorites } from '../../features/favorites/hooks/useFavorites'
import { SettingsContent, type SettingsUser } from './settings/SettingsPage'

function displayNameFromAuth(fallback: string): string {
  const authUser = getUser()
  if (!authUser) return fallback
  return (
    authUser.name ||
    [authUser.firstName, authUser.lastName].filter(Boolean).join(' ') ||
    authUser.email?.split('@')[0] ||
    fallback
  )
}

export function TenantDashboard() {
  const [location, setLocation] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [type, setType] = useState('all')
  const locationObj = useLocation()
  const activeTab = (() => {
    const path = locationObj.pathname.replace('/dashboard', '') || '/'
    if (path === '/' || path === '') return 'home'
    if (path === '/inspections') return 'inspections'
    if (path === '/payments') return 'payments'
    if (path === '/saved') return 'saved'
    if (path === '/agreement') return 'agreement'
    if (path === '/settings') return 'settings'
    return 'home'
  })()

  const [gridProperties, setGridProperties] = useState<DashboardProperty[]>([])
  const [agreements, setAgreements] = useState<TenantAgreement[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tenantUser, setTenantUser] = useState<SettingsUser>(() => {
    const authUser = getUser()
    return {
      name: displayNameFromAuth(''),
      email: authUser?.email ?? '',
      phone: authUser?.phone ?? '',
    }
  })
  const { favorites, toggle: toggleFavorite, savedAt } = useFavorites()

  useEffect(() => {
    let active = true
    refreshProfile().then((profile) => {
      if (active && profile) {
        setTenantUser({
          name: profile.name || profile.email?.split('@')[0] || '',
          email: profile.email ?? '',
          phone: profile.phone ?? '',
        })
      }
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    propertyService.getProperties()
      .then((items) => {
        if (active) setGridProperties(items.map(propertyToDashboardProperty))
      })
      .catch((err) => {
        const message = apiErrorMessage(err)
        if (active && message) setLoadError(message)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    loadWithFallback(
      async () => {
        const leases = await listCallerLeases(1, 50)
        return leases.map((lease) => leaseToTenantAgreement(lease))
      },
      [],
    ).then((result) => {
      if (active) {
        setAgreements(result.data)
        if (result.error) setLoadError(result.error)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const savedProperties = useMemo<SavedProperty[]>(
    () =>
      favorites
        .map((id) => {
          const match = gridProperties.find((p) => p.id === id)
          return match ? { ...match, savedAt: savedAt(id) ?? '' } : null
        })
        .filter((entry): entry is SavedProperty => entry !== null),
    [favorites, gridProperties, savedAt],
  )

  const filtered = useMemo(() => {
    const loc = location.trim().toLowerCase()
    const priceNum = Number(maxPrice)
    return gridProperties.filter((p) => {
      const locOk = loc === '' || p.location.toLowerCase().includes(loc)
      const priceOk = maxPrice.trim() === '' || (!isNaN(priceNum) && p.price <= priceNum)
      const typeOk = type === 'all' || p.type === type
      return locOk && priceOk && typeOk
    })
  }, [gridProperties, location, maxPrice, type])

  const clear = () => {
    setLocation('')
    setMaxPrice('')
    setType('all')
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="px-[clamp(16px,4vw,40px)] pb-16 pt-0">
            <header className="mb-1">
              <h1 className="font-serif text-3xl font-bold text-green-dark md:text-4xl">Find your next home</h1>
              <p className="mt-0 text-ink/70">
                {filtered.length} verified homes matching your search
              </p>
            </header>

            <SearchFilters
              location={location}
              onLocationChange={setLocation}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              type={type}
              onTypeChange={setType}
              onClear={clear}
            />

            <div className="mt-2">
              <PropertyGrid 
                properties={filtered} 
                savedProperties={savedProperties.map(p => p.id)}
                onToggleSave={toggleFavorite}
              />
            </div>
          </div>
        )
      case 'inspections':
        return <TenantInspectionsPage />
      case 'payments':
        return <TenantPaymentsPage />
      case 'saved':
        return (
          <TenantSavedPage
            savedProperties={savedProperties}
            onRemoveFromSaved={toggleFavorite}
            onToggleSave={toggleFavorite}
          />
        )
      case 'agreement':
        return (
          <div className="px-[clamp(16px,4vw,40px)] pb-16 pt-4">
            <header className="mb-2">
              <h1 className="font-serif text-3xl font-bold text-green-dark md:text-4xl">Agreements</h1>
              <p className="mt-0.5 text-ink/70">
                {agreements.length} agreements
              </p>
            </header>

<div className="mt-6 space-y-4">
              {agreements.length === 0 ? (
                <div className="rounded-xl border border-sage bg-white p-12 text-center">
                  <svg className="w-12 h-12 mx-auto text-mist mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2H7a2 2 0 01-2-2v-6" />
                  </svg>
                  <h3 className="font-serif text-xl font-semibold text-forest mb-1">No agreements yet</h3>
                  <p className="mt-2 text-sm text-mist">Agreements will appear here when you request inspections.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agreements.map((agreement) => (
                    <Link
                      key={agreement.id}
                      to={`/dashboard/agreement/${agreement.id}`}
                      className="block"
                    >
                      <div className="rounded-xl border border-sage bg-white p-5 hover:bg-sage/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-serif text-lg font-semibold text-forest">
                              Tenancy Agreement &mdash; {agreement.propertyTitle}
                            </h3>
                            <p className="mt-1 text-sm text-mist">{agreement.propertyLocation} &middot; {agreement.term}</p>
                          </div>
                          <StatusPill tone={getAgreementStatus(agreement.status).tone}>
                            {getAgreementStatus(agreement.status).label}
                          </StatusPill>
                        </div>
                        <div className="mt-3 pt-3 border-t border-sage flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-mist">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 01-9 9m9-9a9 9 0 01-9-9" />
                            </svg>
                            <span>{agreement.lawyer.name}</span>
                            <span className="text-forest">·</span>
                            <span>{agreement.lawyer.reviewingSince}</span>
                          </div>
                          <StatusPill tone={getAgreementStatus(agreement.status).tone}>
                            {getAgreementStatus(agreement.status).label}
                          </StatusPill>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className="px-[clamp(16px,4vw,40px)] pb-16 pt-4">
            <SettingsContent role="tenant" user={tenantUser} onProfileSave={setTenantUser} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <ToastProvider>
      <Seo title="Tenant Dashboard · Rent Bridge" description="Your Rent Bridge tenant dashboard" />
      {loadError && <div className="px-[clamp(16px,4vw,40px)] pt-8"><DataErrorBanner message={loadError} /></div>}
      {renderTabContent()}
    </ToastProvider>
  )
}

export function AgentDashboard() {
  const routerLocation = useLocation()
  const [agentUser, setAgentUser] = useState<SettingsUser>(() => {
    const authUser = getUser()
    return {
      name: displayNameFromAuth('Agent'),
      email: authUser?.email ?? '',
      phone: authUser?.phone ?? '',
    }
  })
  const [location, setLocation] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [type, setType] = useState('all')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [agentProperties, setAgentProperties] = useState<DashboardProperty[]>([])

  useEffect(() => {
    let active = true
    propertyService.getProperties()
      .then((items) => {
        if (active) setAgentProperties(items.map(propertyToDashboardProperty))
      })
      .catch((err) => {
        const message = apiErrorMessage(err)
        if (active && message) setLoadError(message)
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const loc = location.trim().toLowerCase()
    const priceNum = Number(maxPrice)
    return agentProperties.filter((p) => {
      const locOk = loc === '' || p.location.toLowerCase().includes(loc)
      const priceOk = maxPrice.trim() === '' || (!isNaN(priceNum) && p.price <= priceNum)
      const typeOk = type === 'all' || p.type === type
      return locOk && priceOk && typeOk
    })
  }, [agentProperties, location, maxPrice, type])

  const clear = () => {
    setLocation('')
    setMaxPrice('')
    setType('all')
  }

  if (routerLocation.pathname.endsWith('/settings')) {
    return (
      <div className="px-[clamp(16px,4vw,40px)] pb-16 pt-8">
        <SettingsContent role="agent" user={agentUser} onProfileSave={setAgentUser} />
      </div>
    )
  }

  return (
    <div className="px-[clamp(16px,4vw,40px)] pb-16 pt-8">
      <DataErrorBanner message={loadError} />
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-green-dark md:text-4xl">
          Agent Properties
        </h1>
        <p className="mt-2 text-ink/70">
          {filtered.length} agent properties matching your search
        </p>
      </header>

      <div className="mb-6 max-w-xl">
        <VerificationCard />
      </div>

      <SearchFilters
        location={location}
        onLocationChange={setLocation}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        type={type}
        onTypeChange={setType}
        onClear={clear}
      />

      <div className="mt-8">
        <PropertyGrid properties={filtered} />
      </div>
    </div>
  )
}

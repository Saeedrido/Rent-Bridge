import { useMemo, useState } from 'react'
import { Seo } from '../../components/common'
import { dashboardProperties } from '../../features/dashboard/data/dashboardProperties'
import { SearchFilters } from '../../features/dashboard/components/SearchFilters'
import { PropertyGrid } from '../../features/dashboard/components/PropertyGrid'
import { TenantInspectionsPage } from '../../features/dashboard/tenant/TenantInspectionsPage2'
import { TenantPaymentsPage } from '../../features/dashboard/tenant/TenantPaymentsPage'
import { TenantSavedPage } from '../../features/dashboard/tenant/TenantSavedPage'
import { initialSavedProperties, type SavedProperty, tenantInspections, tenantAgreements, getAgreementStatus } from './tenant/tenantData'
import { useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { StatusPill, ToastProvider } from '@/features/dashboard/roleDashboards/shared'

type TenantTab = 'home' | 'saved' | 'inspections' | 'agreement' | 'payments' | 'profile'

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
    if (path === '/profile') return 'profile'
    return 'home'
  })()

  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>(initialSavedProperties)

  const filtered = useMemo(() => {
    const loc = location.trim().toLowerCase()
    const priceNum = Number(maxPrice)
    return dashboardProperties.filter((p) => {
      const locOk = loc === '' || p.location.toLowerCase().includes(loc)
      const priceOk = maxPrice.trim() === '' || (!isNaN(priceNum) && p.price <= priceNum)
      const typeOk = type === 'all' || p.type === type
      return locOk && priceOk && typeOk
    })
  }, [location, maxPrice, type])

  const clear = () => {
    setLocation('')
    setMaxPrice('')
    setType('all')
  }

  const handleToggleSave = (propertyId: string) => {
    setSavedProperties(prev => {
      const existing = prev.find(p => p.id === propertyId)
      if (existing) {
        return prev.filter(p => p.id !== propertyId)
      } else {
        const property = dashboardProperties.find(p => p.id === propertyId)
        if (property) {
          return [...prev, { ...property, savedAt: new Date().toISOString() }]
        }
        return prev
      }
    })
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="px-[clamp(16px,4vw,40px)] pb-16 pt-0">
            <header className="mb-1">
              <h1 className="font-serif text-3xl font-bold text-green-dark md:text-4xl">Homes near Yaba, Lagos</h1>
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
                onToggleSave={handleToggleSave}
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
            onRemoveFromSaved={handleToggleSave}
            onPropertyClick={(property) => {
              // Navigate to property details - handled by link in PropertyCard
            }}
            onToggleSave={handleToggleSave}
          />
        )
      case 'agreement':
        return (
          <div className="px-[clamp(16px,4vw,40px)] pb-16 pt-4">
            <header className="mb-2">
              <h1 className="font-serif text-3xl font-bold text-green-dark md:text-4xl">Agreements</h1>
              <p className="mt-0.5 text-ink/70">
                {tenantAgreements.filter(a => a.propertyId && savedProperties.some(p => p.id === a.propertyId)).length} agreements
              </p>
            </header>

<div className="mt-6 space-y-4">
              {tenantAgreements.filter(a => a.propertyId && savedProperties.some(p => p.id === a.propertyId)).length === 0 ? (
                <div className="rounded-xl border border-sage bg-white p-12 text-center">
                  <svg className="w-12 h-12 mx-auto text-mist mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2H7a2 2 0 01-2-2v-6" />
                  </svg>
                  <h3 className="font-serif text-xl font-semibold text-forest mb-1">No agreements yet</h3>
                  <p className="mt-2 text-sm text-mist">Agreements will appear here when you request inspections.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tenantAgreements.filter(a => a.propertyId && savedProperties.some(p => p.id === a.propertyId)).map((agreement) => (
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
      case 'profile':
        return (
          <div className="px-[clamp(16px,4vw,40px)] pb-16 pt-8">
            <h1 className="font-serif text-3xl font-bold text-green-dark md:text-4xl mb-6">Profile</h1>
            <div className="rounded-xl border border-sage bg-white p-8 max-w-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sage-soft text-2xl font-bold text-forest">
                  T
                </div>
                <div>
                  <h2 className="font-serif text-xl font-semibold text-ink">Tenant User</h2>
                  <p className="mt-1 text-sm text-mist">tenant@rentbridge.ng</p>
                  <p className="text-sm text-mist">+234 803 555 0123</p>
                </div>
              </div>
              <div className="rounded-xl border border-sage bg-white p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage-soft">
                    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="text-forest">
                      <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" />
                      <path d="M9 12l2.2 2.2L15.5 9.7" />
                    </svg>
                  </div>
                  <div className="pt-1">
                    <h3 className="font-semibold text-ink">Identity verified</h3>
                    <p className="mt-1 text-sm text-mist">Verified Tenant · KYC completed on 4 Feb 2026</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <ToastProvider>
      <Seo title="Tenant Dashboard · Rent Bridge" description="Your Rent Bridge tenant dashboard" />
      {renderTabContent()}
    </ToastProvider>
  )
}

export function AgentDashboard() {
  const [location, setLocation] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [type, setType] = useState('all')

  const agentProperties = useMemo(() => {
    return dashboardProperties.filter((p) => p.id === 'd1' || p.id === 'd3' || p.id === 'd5')
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
  }, [location, maxPrice, type])

  const clear = () => {
    setLocation('')
    setMaxPrice('')
    setType('all')
  }

  return (
    <div className="px-[clamp(16px,4vw,40px)] pb-16 pt-8">
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-green-dark md:text-4xl">
          Agent Properties
        </h1>
        <p className="mt-2 text-ink/70">
          {filtered.length} agent properties matching your search
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

      <div className="mt-8">
        <PropertyGrid properties={filtered} />
      </div>
    </div>
  )
}
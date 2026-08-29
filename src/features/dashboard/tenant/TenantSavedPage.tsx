import { useState, useCallback } from 'react'
import { HeartIcon } from '../components/icons'
import { PageHeading, EmptyState, useToast } from '../roleDashboards/shared'
import type { SavedProperty } from './tenantData'
import type { DashboardProperty } from '../../dashboard/data/dashboardProperties'

interface SavedPageProps {
  savedProperties: SavedProperty[]
  onRemoveFromSaved?: (propertyId: string) => void
  onPropertyClick?: (property: DashboardProperty) => void
  onToggleSave?: (propertyId: string) => void
}

export function TenantSavedPage({ 
  savedProperties, 
  onRemoveFromSaved, 
  onPropertyClick,
  onToggleSave 
}: SavedPageProps) {
  const [sortBy, setSortBy] = useState<'newest' | 'lowest-rent' | 'highest-rent' | 'recently-added'>('newest')
  const { show } = useToast()

  const handleRemoveFromSaved = useCallback((propertyId: string) => {
    if (onRemoveFromSaved) {
      onRemoveFromSaved(propertyId)
    }
    if (onToggleSave) {
      onToggleSave(propertyId)
    }
    show('Unsaved')
  }, [onRemoveFromSaved, onToggleSave, show])

  const handlePropertyClick = (property: SavedProperty) => {
    if (onPropertyClick) {
      onPropertyClick(property)
    }
  }

  const sortedProperties = [...savedProperties].sort((a, b) => {
    switch (sortBy) {
      case 'lowest-rent': return a.price - b.price
      case 'highest-rent': return b.price - a.price
      case 'newest':
      case 'recently-added':
      default: return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    }
  })

return (
    <div className="px-[clamp(16px,4vw,40px)]">
      <PageHeading
        title="Saved listings"
        subtitle="Properties you've saved to view later."
        action={
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-sm border border-sage rounded-lg px-3 py-2 bg-white text-forest focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
          >
            <option value="newest">Newest saved</option>
            <option value="lowest-rent">Lowest rent</option>
            <option value="highest-rent">Highest rent</option>
            <option value="recently-added">Recently added</option>
          </select>
        }
      />
      <div className="mt-8">
        {sortedProperties.length === 0 ? (
          <EmptyState
            icon={
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-soft">
                <HeartIcon className="w-7 h-7 text-forest" />
              </div>
            }
            title="Nothing saved yet"
            body="Open a listing and tap Save."
            action={
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-forest/30 bg-white px-5 py-2.5 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft"
              >
                Browse properties
              </button>
            }
          />
        ) : (
          <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {sortedProperties.map((property) => (
              <article
                key={property.id}
                onClick={() => handlePropertyClick(property)}
                className="group rounded-xl border border-sage bg-white overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
              >
                <div className="relative" style={{ height: 220, background: '#E7E2D8' }}>
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFromSaved(property.id)
                    }}
                    className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-flame transition-colors hover:bg-white hover:text-flame-dark"
                    aria-label="Remove from saved"
                  >
                    <HeartIcon className="w-5 h-5 fill-current" />
                  </button>
                  {property.verified && (
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded bg-orange px-2 py-1 text-[11px] font-bold uppercase tracking-[.06em] text-white">
                      Verified
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-sm text-mist">{property.location}</p>
                  <h3 className="mt-1 font-serif text-lg font-semibold text-forest group-hover:underline line-clamp-1">
                    {property.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-mist">
                    <span>{property.beds} bed</span>
                    <span>{property.baths} bath</span>
                    <span>{property.typeLabel}</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-[22px] font-bold text-ink">{property.price.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })}</span>
                    <span className="text-sm text-mist">/ year</span>
                  </div>
                  <div className="mt-2 text-sm text-mist">
                    Available from 1 Sept 2026
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePropertyClick(property)
                    }}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-forest/30 bg-white px-4 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft"
                  >
                    View property
                  </button>
                </div>
              </article>
))}
          </div>
        )}
      </div>
    </div>
  )
}
import { useState, useCallback } from 'react'
import { HeartIcon } from '../components/icons'
import { PageHeading, EmptyState, useToast } from '../roleDashboards/shared'
import type { SavedProperty } from './tenantData'
import type { DashboardProperty } from '../../dashboard/data/dashboardProperties'
import { rentFrequencyLabel } from '../../../utils/format'

function shortDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || ''
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

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
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {sortedProperties.map((property) => (
              <article
                key={property.id}
                onClick={() => handlePropertyClick(property)}
                className="group rounded-xl border border-sage bg-white overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
              >
                <div className="relative aspect-[4/3] bg-[#E7E2D8] sm:aspect-auto sm:h-[220px]">
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
                    className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-flame transition-colors hover:bg-white hover:text-flame-dark sm:top-3 sm:right-3 sm:h-9 sm:w-9"
                    aria-label="Remove from saved"
                  >
                    <HeartIcon className="h-4 w-4 fill-current sm:h-5 sm:w-5" />
                  </button>
                  {property.verified && (
                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-orange px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[.06em] text-white sm:bottom-3 sm:right-3 sm:gap-1.5 sm:px-2 sm:py-1 sm:text-[11px]">
                      Verified
                    </span>
                  )}
                </div>
                <div className="p-3 sm:p-5">
                  <p className="text-[11px] text-mist sm:text-sm">{property.location}</p>
                  <h3 className="mt-1 line-clamp-2 font-serif text-[15px] font-semibold leading-snug text-forest group-hover:underline sm:text-lg">
                    {property.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-mist sm:gap-3 sm:text-sm">
                    <span>{property.beds} bed</span>
                    <span>{property.baths} bath</span>
                    <span>{property.typeLabel}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-1 sm:mt-3">
                    <span className="text-[15px] font-bold text-ink sm:text-[22px]">{property.price.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })}</span>
                    <span className="text-[11px] text-mist sm:text-sm">{rentFrequencyLabel(property.rentFrequency)}</span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-mist sm:mt-2 sm:text-sm">
                    {property.availableFrom
                      ? `Available from ${shortDate(property.availableFrom)}`
                      : `Saved ${shortDate(property.savedAt) || 'just now'}`}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePropertyClick(property)
                    }}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-forest/30 bg-white px-3 py-2 text-[12px] font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft sm:mt-4 sm:px-4 sm:py-2.5 sm:text-sm"
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
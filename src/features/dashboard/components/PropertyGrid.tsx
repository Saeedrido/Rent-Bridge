import type { DashboardProperty } from '../data/dashboardProperties'
import { PropertyCard } from './PropertyCard'
import { DashboardPropertyCardSkeleton } from '../../../components/ui'

export function PropertyGrid({ 
  properties, 
  savedProperties = [],
  onToggleSave,
  loading = false
}: { 
  properties: DashboardProperty[]
  savedProperties?: string[]
  onToggleSave?: (id: string) => void
  loading?: boolean
}) {
  if (loading) {
    return <DashboardPropertyCardSkeleton count={6} />
  }

  if (properties.length === 0) {
    return (
      <div className="rounded-card border border-green/15 bg-white p-10 text-center text-ink/60">
        No homes match your filters.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          isSaved={savedProperties?.includes(property.id)}
          onToggleSave={onToggleSave}
        />
      ))}
    </div>
  )
}

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { SearchFilters } from '../../search/types/search'
import { useSearchFilters } from '../../search/hooks/useSearchFilters'
import { SearchFilters as FiltersPanel } from '../../search/components/SearchFilters'
import { PropertyCard } from '../../../components/common'
import { Button, EmptyState, PropertyCardSkeleton } from '../../../components/ui'
import { DataErrorBanner } from '../../../features/dashboard/roleDashboards/shared'
import { useSectionLoader } from '../../../hooks/useLoading'

interface Props {
  initialFilters?: Partial<SearchFilters>
}

export function ListingView({ initialFilters }: Props) {
  const location = useLocation()
  const stateLocation = (location.state as { location?: string } | null)?.location

  const [showFilters, setShowFilters] = useState(false)
  const { filters, updateFilter, toggleAmenity, reset, properties, loading, error } = useSearchFilters({
    ...initialFilters,
    ...(stateLocation ? { location: stateLocation } : {}),
  })

  const { isLoading: filterLoading, withLoading: filterWithLoading } = useSectionLoader('search-filters')

  const handleFilterChange = (key: keyof SearchFilters, value: SearchFilters[keyof SearchFilters]) => {
    filterWithLoading(Promise.resolve().then(() => updateFilter(key, value)))
  }

  const handleToggleAmenity = (amenity: string) => {
    filterWithLoading(Promise.resolve().then(() => toggleAmenity(amenity)))
  }

  const handleReset = () => {
    filterWithLoading(Promise.resolve().then(() => reset()))
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <div className={showFilters ? 'block' : 'hidden lg:block'}>
        <FiltersPanel
          filters={filters}
          updateFilter={handleFilterChange}
          toggleAmenity={handleToggleAmenity}
          reset={handleReset}
          total={properties.length}
          disabled={filterLoading}
        />
      </div>

      <div>
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-ink/70">
            <span className="font-semibold text-ink">{properties.length}</span>{' '}
            {properties.length === 1 ? 'property' : 'properties'} available
          </p>
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters((s) => !s)} disabled={filterLoading}>
            {showFilters ? 'Hide filters' : 'Filters'}
          </Button>
        </div>

        <DataErrorBanner message={error} />

        {loading ? (
          <PropertyCardSkeleton count={6} />
        ) : properties.length === 0 ? (
          <EmptyState
            title="No properties match your filters"
            description="Try widening your price range or clearing a few filters."
            action={<Button onClick={handleReset} disabled={filterLoading}>Clear filters</Button>}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { SearchFilters } from '../../search/types/search'
import { useSearchFilters } from '../../search/hooks/useSearchFilters'
import { SearchFilters as FiltersPanel } from '../../search/components/SearchFilters'
import { PropertyCard } from '../../../components/common'
import { Button, EmptyState } from '../../../components/ui'

interface Props {
  initialFilters?: Partial<SearchFilters>
}

export function ListingView({ initialFilters }: Props) {
  const location = useLocation()
  const stateLocation = (location.state as { location?: string } | null)?.location

  const [showFilters, setShowFilters] = useState(false)
  const { filters, updateFilter, toggleAmenity, reset, properties } = useSearchFilters({
    ...initialFilters,
    ...(stateLocation ? { location: stateLocation } : {}),
  })

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <div className={showFilters ? 'block' : 'hidden lg:block'}>
        <FiltersPanel
          filters={filters}
          updateFilter={updateFilter}
          toggleAmenity={toggleAmenity}
          reset={reset}
          total={properties.length}
        />
      </div>

      <div>
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-ink/70">
            <span className="font-semibold text-ink">{properties.length}</span>{' '}
            {properties.length === 1 ? 'property' : 'properties'} available
          </p>
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters((s) => !s)}>
            {showFilters ? 'Hide filters' : 'Filters'}
          </Button>
        </div>

        {properties.length === 0 ? (
          <EmptyState
            title="No properties match your filters"
            description="Try widening your price range or clearing a few filters."
            action={<Button onClick={reset}>Clear filters</Button>}
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

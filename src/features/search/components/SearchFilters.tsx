import type { SearchFilters, SortOption } from '../types/search'
import type { PropertyType } from '../../properties/types/property'
import { PROPERTY_TYPES, AMENITIES } from '../../properties/data/constants'
import { Input, Select, Field, Button } from '../../../components/ui'
import { cn } from '../../../utils/cn'

interface Props {
  filters: SearchFilters
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void
  toggleAmenity: (amenity: string) => void
  reset: () => void
  total: number
  disabled?: boolean
}

const bedsOptions = [1, 2, 3, 4, 5]
const bathsOptions = [1, 2, 3, 4, 5]

export function SearchFilters({ filters, updateFilter, toggleAmenity, reset, total, disabled = false }: Props) {
  return (
    <aside className="rounded-card border border-green/15 bg-white p-5 lg:sticky lg:top-24">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-green-dark">Filters</h2>
        <button onClick={reset} disabled={disabled} className="text-sm font-medium text-orange hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
          Reset
        </button>
      </div>

      <div className="space-y-4">
        <Field label="Search">
          <Input
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            placeholder="Title or area"
            disabled={disabled}
          />
        </Field>

        <Field label="Listing type">
          <Select
            value={filters.listingType}
            onChange={(e) => updateFilter('listingType', e.target.value as SearchFilters['listingType'])}
            disabled={disabled}
          >
            <option value="all">All</option>
            <option value="rent">Rent</option>
            <option value="sale">Buy</option>
          </Select>
        </Field>

        <Field label="Property type">
          <Select
            value={filters.propertyType}
            onChange={(e) => updateFilter('propertyType', e.target.value as PropertyType | 'all')}
            disabled={disabled}
          >
            <option value="all">All types</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Location">
          <Input
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            placeholder="e.g. Yaba, Lagos"
            disabled={disabled}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Min price">
            <Input
              type="number"
              value={filters.minPrice ?? ''}
              onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : null)}
              placeholder="₦"
              disabled={disabled}
            />
          </Field>
          <Field label="Max price">
            <Input
              type="number"
              value={filters.maxPrice ?? ''}
              onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : null)}
              placeholder="₦"
              disabled={disabled}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Bedrooms">
            <Select
              value={filters.beds ?? ''}
              onChange={(e) => updateFilter('beds', e.target.value ? Number(e.target.value) : null)}
              disabled={disabled}
            >
              <option value="">Any</option>
              {bedsOptions.map((b) => (
                <option key={b} value={b}>
                  {b}+
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Bathrooms">
            <Select
              value={filters.baths ?? ''}
              onChange={(e) => updateFilter('baths', e.target.value ? Number(e.target.value) : null)}
              disabled={disabled}
            >
              <option value="">Any</option>
              {bathsOptions.map((b) => (
                <option key={b} value={b}>
                  {b}+
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Sort by">
          <Select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value as SortOption)} disabled={disabled}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="beds-desc">Most bedrooms</option>
          </Select>
        </Field>

        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => updateFilter('verifiedOnly', e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 accent-orange"
          />
          Verified only
        </label>

        <div>
          <span className="mb-2 block text-sm font-medium text-ink">Amenities</span>
          <div className="grid grid-cols-2 gap-2">
            {AMENITIES.map((a) => {
              const checked = filters.amenities.includes(a)
              return (
                <label key={a} className={cn('flex items-center gap-2 text-sm', checked ? 'text-ink' : 'text-ink/70')}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAmenity(a)}
                    disabled={disabled}
                    className="h-4 w-4 accent-orange"
                  />
                  {a}
                </label>
              )
            })}
          </div>
        </div>

        <p className="text-sm text-ink/60">{total} properties found</p>
        <Button type="button" fullWidth onClick={reset} disabled={disabled}>
          Clear all
        </Button>
      </div>
    </aside>
  )
}

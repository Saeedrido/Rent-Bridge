import { Field, Input, Button } from '../../../components/ui'
import { PropertyTypeDropdown } from './PropertyTypeDropdown'
import { SearchIcon } from './icons'

interface SearchFiltersProps {
  location: string
  onLocationChange: (value: string) => void
  maxPrice: string
  onMaxPriceChange: (value: string) => void
  type: string
  onTypeChange: (value: string) => void
  onClear: () => void
}

export function SearchFilters({
  location,
  onLocationChange,
  maxPrice,
  onMaxPriceChange,
  type,
  onTypeChange,
  onClear,
}: SearchFiltersProps) {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="rounded-card border border-green/25 bg-white p-4 md:p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <Field label="Search by location" className="flex-1" labelClassName="text-sm font-semibold !text-green-dark">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-green/60" />
            <Input
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Any area"
              className="pl-9 !text-green-dark placeholder:!text-green/50"
              aria-label="Search by location"
            />
          </div>
        </Field>

        <Field label="Max price (₦)" className="md:w-44" labelClassName="text-sm font-semibold !text-green-dark">
          <Input
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            placeholder="e.g. 1500000"
            inputMode="numeric"
            aria-label="Maximum price in naira"
            className="!text-green-dark placeholder:!text-green/50"
          />
        </Field>

        <Field label="Apartment type" className="md:w-48" labelClassName="text-sm font-semibold !text-green-dark">
          <PropertyTypeDropdown value={type} onChange={onTypeChange} />
        </Field>

        <Button type="button" variant="outline" onClick={onClear} className="md:mb-[2px]">
          Clear filters
        </Button>
      </div>
    </form>
  )
}

import type { Property } from '../types/property'
import { Badge } from '../../../components/ui'
import { formatNaira } from '../../../utils/format'

export function PropertyHeader({ property }: { property: Property }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {property.verified && <Badge tone="orange">Verified</Badge>}
        <Badge tone="green">{property.listingType === 'rent' ? 'For rent' : 'For sale'}</Badge>
      </div>
      <h1 className="mt-3 font-serif text-3xl font-bold text-green-dark md:text-4xl">{property.title}</h1>
      <p className="mt-1 text-ink/70">
        {property.location}, {property.city}, {property.state}
      </p>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-ink">
        <span className="text-2xl font-bold">
          {formatNaira(property.price)}
          {property.listingType === 'rent' && <span className="text-base font-normal text-ink/60"> / year</span>}
        </span>
        <span className="text-sm">{property.beds} bedrooms</span>
        <span className="text-sm">{property.baths} bathrooms</span>
        {property.area && <span className="text-sm">{property.area} m²</span>}
      </div>
    </div>
  )
}

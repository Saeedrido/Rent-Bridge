import { Link } from 'react-router-dom'
import type { Property } from '../../features/properties/types/property'
import { useFavorites } from '../../features/favorites/hooks/useFavorites'
import { formatNaira } from '../../utils/format'
import { PropertyImage } from './PropertyImage'

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#E4661F' : 'none'} stroke="#E4661F" strokeWidth="1.8">
      <path d="M12 21s-7.5-4.6-10-9.3C.4 8.3 2 4.8 5.4 4.8c2 0 3.4 1.1 4.6 2.7C11.2 5.9 12.6 4.8 14.6 4.8c3.4 0 5 3.5 3.4 6.9C19.5 16.4 12 21 12 21z" />
    </svg>
  )
}

export function PropertyCard({ property }: { property: Property }) {
  const { isFavorite, toggle } = useFavorites()
  const favorite = isFavorite(property.id)

  return (
    <article className="group relative bg-white rounded-card border border-green/15 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_22px_40px_-28px_rgba(18,74,40,.6)] hover:border-orange/60">
      <Link to={`/properties/${property.slug}`} className="block relative" style={{ height: 190, background: '#E7E2D8' }}>
        <PropertyImage src={property.coverImage} alt={property.title} />
        {property.verified && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-orange text-white text-[11px] font-bold uppercase tracking-[.06em] rounded px-2 py-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
            Verified
          </span>
        )}
      </Link>

      <button
        onClick={() => toggle(property.id)}
        aria-label={favorite ? 'Remove from favorites' : 'Save to favorites'}
        aria-pressed={favorite}
        className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition-colors"
      >
        <HeartIcon filled={favorite} />
      </button>

      <div className="p-4">
        <div className="text-ink/60 text-[13px] mb-1.5">{property.location}</div>
        <h3 className="font-serif text-lg font-semibold text-green-dark mb-1">
          <Link to={`/properties/${property.slug}`} className="no-underline text-inherit hover:text-orange">
            {property.title}
          </Link>
        </h3>
        <div className="font-semibold text-ink text-[15px]">
          {formatNaira(property.price)}{' '}
          {property.listingType === 'rent' && <span className="font-normal text-ink/60 text-[13px]">/ year</span>}
        </div>
        <div className="mt-3 flex items-center gap-4 text-ink/70 text-sm">
          <span>{property.beds} bd</span>
          <span>{property.baths} ba</span>
          {property.area && <span>{property.area} m²</span>}
        </div>
      </div>
    </article>
  )
}

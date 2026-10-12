import { Link } from 'react-router-dom'
import type { Property } from '../../features/properties/types/property'
import { useFavorites } from '../../features/favorites/hooks/useFavorites'
import { formatNaira, rentFrequencyLabel } from '../../utils/format'
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
      <Link to={`/properties/${property.slug}`} className="block relative aspect-[4/3] bg-[#E7E2D8] sm:aspect-auto sm:h-[190px]">
        <PropertyImage src={property.coverImage} alt={property.title} />
        {property.verified && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-orange px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[.06em] text-white sm:bottom-3 sm:right-3 sm:gap-1.5 sm:px-2 sm:py-1 sm:text-[11px]">
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
        className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition-colors sm:top-3 sm:right-3 sm:h-9 sm:w-9"
      >
        <HeartIcon filled={favorite} />
      </button>

      <div className="p-3 sm:p-4">
        <div className="mb-1 text-[11px] text-ink/60 sm:mb-1.5 sm:text-[13px]">{property.location}</div>
        <h3 className="mb-1 line-clamp-2 font-serif text-[15px] font-semibold leading-snug text-green-dark sm:text-lg">
          <Link to={`/properties/${property.slug}`} className="no-underline text-inherit hover:text-orange">
            {property.title}
          </Link>
        </h3>
        <div className="text-[13px] font-semibold text-ink sm:text-[15px]">
          {formatNaira(property.price)}{' '}
          {property.listingType === 'rent' && (
            <span className="text-[11px] font-normal text-ink/60 sm:text-[13px]">{rentFrequencyLabel(property.rentFrequency)}</span>
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink/70 sm:mt-3 sm:gap-4 sm:text-sm">
          <span>{property.beds} bd</span>
          <span>{property.baths} ba</span>
          {property.area && <span>{property.area} m²</span>}
        </div>
      </div>
    </article>
  )
}

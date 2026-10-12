import { Link } from 'react-router-dom'
import { formatNaira, rentFrequencyLabel } from '../../../utils/format'
import type { DashboardProperty } from '../data/dashboardProperties'
import { CheckIcon, HeartIcon } from './icons'
import { cn } from '../../../utils/cn'
import { useToast } from '../roleDashboards/shared'

interface PropertyCardProps {
  property: DashboardProperty
  isSaved?: boolean
  onToggleSave?: (id: string) => void
}

export function PropertyCard({ property, isSaved = false, onToggleSave }: PropertyCardProps) {
  const { show } = useToast()
  
  return (
    <Link to={`/dashboard/properties/${property.id}`} className="block">
      <article className="group overflow-hidden rounded-card border border-green/15 bg-white transition-all hover:-translate-y-1 hover:border-orange/60 hover:shadow-[0_22px_40px_-28px_rgba(18,74,40,.6)]">
        <div className="relative aspect-[4/3] bg-[#E7E2D8] sm:aspect-auto sm:h-[230px]">
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleSave?.(property.id)
              show(isSaved ? 'Unsaved' : 'Saved')
            }}
            className={cn(
              'absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 transition-colors sm:right-3 sm:top-3 sm:h-9 sm:w-9',
              isSaved
                ? 'text-flame'
                : 'text-ink/60 hover:text-flame'
            )}
            aria-label={isSaved ? 'Remove from saved' : 'Save property'}
          >
            <HeartIcon className={cn('h-4 w-4 sm:h-5 sm:w-5', isSaved ? 'fill-current' : '')} />
          </button>
          {property.verified && (
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-orange px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[.06em] text-white sm:bottom-3 sm:right-3 sm:gap-1.5 sm:px-2 sm:py-1 sm:text-[11px]">
              <CheckIcon className="text-white" />
              Verified
            </span>
          )}
        </div>

        <div className="p-3 sm:p-4">
          <div className="mb-1 text-[11px] text-ink/60 sm:mb-1.5 sm:text-[13px]">{property.location}</div>
          <h3 className="mb-1 line-clamp-2 font-serif text-[15px] font-semibold leading-snug text-green-dark sm:text-lg">{property.title}</h3>
          <div className="text-[13px] font-semibold text-ink sm:text-[15px]">
            {formatNaira(property.price)}{' '}
            <span className="text-[11px] font-normal text-ink/60 sm:text-[13px]">
              {rentFrequencyLabel(property.rentFrequency)}
            </span>
          </div>
          <div className="my-2.5 h-px w-full bg-green/10 sm:my-3" />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink/70 sm:gap-4 sm:text-sm">
            <span>{property.beds} bed</span>
            <span>{property.baths} bath</span>
            <span className="truncate">{property.typeLabel}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
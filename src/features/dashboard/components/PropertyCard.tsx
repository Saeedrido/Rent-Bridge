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
        <div className="relative" style={{ height: 230, background: '#E7E2D8' }}>
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
              'absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 transition-colors',
              isSaved
                ? 'text-flame'
                : 'text-ink/60 hover:text-flame'
            )}
            aria-label={isSaved ? 'Remove from saved' : 'Save property'}
          >
            <HeartIcon className={cn('w-5 h-5', isSaved ? 'fill-current' : '')} />
          </button>
          {property.verified && (
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded bg-orange px-2 py-1 text-[11px] font-bold uppercase tracking-[.06em] text-white">
              <CheckIcon className="text-white" />
              Verified
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="mb-1.5 text-[13px] text-ink/60">{property.location}</div>
          <h3 className="mb-1 font-serif text-lg font-semibold text-green-dark">{property.title}</h3>
          <div className="text-[15px] font-semibold text-ink">
            {formatNaira(property.price)}{' '}
            <span className="text-[13px] font-normal text-ink/60">
              {rentFrequencyLabel(property.rentFrequency)}
            </span>
          </div>
          <div className="my-3 h-px w-full bg-green/10" />
          <div className="flex items-center gap-4 text-sm text-ink/70">
            <span>{property.beds} bed</span>
            <span>{property.baths} bath</span>
            <span>{property.typeLabel}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeading, EmptyState, DataErrorBanner } from '../roleDashboards/shared'
import { Button } from '../../../components/ui'
import { InspectionCard } from './InspectionCard'
import { loadWithFallback } from '../../../services/api/fallback'
import { listCallerLeases } from '../../../services/api/leaseApi'
import { leaseToInspection } from '../../../services/api/mappers'

export function TenantInspectionsPage() {
  const [inspections, setInspections] = useState([] as ReturnType<typeof leaseToInspection>[])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const loadInspections = async () => {
    setLoading(true)
    try {
      const result = await loadWithFallback(
        async () => {
          const leases = await listCallerLeases(1, 50)
          return leases.map(leaseToInspection)
        },
        [],
        (value) => value.length === 0,
      )
      setInspections(result.data)
      if (result.error) setLoadError(result.error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInspections()
  }, [])

  return (
    <div className="px-[clamp(16px,4vw,40px)]">
      <DataErrorBanner message={loadError} />
      <PageHeading 
        title="Inspections" 
        subtitle="Your scheduled property inspections"
        action={
          <Button 
            variant="outline"
            onClick={loadInspections}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />
      <div className="mt-8">
        {inspections.length === 0 ? (
          <EmptyState
            icon={
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="text-2xl">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4" />
                <path d="M8 2v4" />
                <path d="M3 10h18" />
              </svg>
            }
            title="No inspections yet"
            body="Properties you request to inspect will appear here."
            action={
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark"
              >
                Browse properties
              </button>
            }
          />
        ) : (
          <div className="mt-8 space-y-6">
            {inspections.map((inspection) => (
              <InspectionCard key={inspection.id} inspection={inspection} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
import { useState } from 'react'
import { PageHeading, EmptyState } from '../roleDashboards/shared'
import { tenantInspections } from './tenantData'
import { InspectionCard } from './InspectionCard'

export function TenantInspectionsPage() {
  const [inspections] = useState(tenantInspections)

  return (
    <div className="px-[clamp(16px,4vw,40px)]">
      <PageHeading title="Inspections" subtitle="Your scheduled property inspections" />
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
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark">
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
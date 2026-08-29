import { getInspectionStatusBadge } from './tenantData'

interface InspectionCardProps {
  inspection: {
    id: string
    propertyTitle: string
    propertyLocation: string
    landlordName: string
    scheduledDate?: string
    status: string
  }
}

export function InspectionCard({ inspection }: InspectionCardProps) {
  return (
    <div className="rounded-xl border border-sage bg-white p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="font-serif text-xl font-semibold text-forest">
            {inspection.propertyTitle}
          </h3>
          <p className="mt-1 text-sm text-mist">{inspection.propertyLocation}</p>
<p className="mt-0.5 text-sm text-mist">
          With {inspection.landlordName} · {inspection.scheduledDate ?? 'TBD'}
        </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.07em] bg-flame-soft text-flame">
          {getInspectionStatusBadge(inspection.status).label}
        </span>
      </div>

      <div className="mt-6">
        <p className="text-sm text-mist">Progress tracker placeholder</p>
      </div>
    </div>
  )
}
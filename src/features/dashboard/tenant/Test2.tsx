import { useState } from 'react'

interface Inspection {
  id: string
  propertyTitle: string
  propertyLocation: string
  landlordName: string
  scheduledDate: string
  status: string
}

const inspections: Inspection[] = [
  { id: '1', propertyTitle: 'Test', propertyLocation: 'Loc', landlordName: 'LL', scheduledDate: '12 Aug', status: 'confirmed' },
]

export function TestPage() {
  const [inspections] = useState(inspections)
  return (
    <div>
      {inspections.map((inspection) => (
        <div key={inspection.id} className="rounded-xl border border-sage bg-white p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h3 className="font-serif text-xl font-semibold text-forest">
                {inspection.propertyTitle}
              </h3>
              <p className="mt-1 text-sm text-mist">{inspection.propertyLocation}</p>
              <p className="mt-0.5 text-sm text-mist">
                With {inspection.landlordName} · {inspection.scheduledDate}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
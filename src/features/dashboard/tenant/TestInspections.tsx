import { useState } from 'react'
import { PageHeading, EmptyState, StatusPill, cn } from '../../shared'
import { tenantInspections, getInspectionStatusBadge, type Inspection } from '../tenantData'

const inspectionSteps = [
  { key: 'requested', label: 'Requested' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'lawyer-review', label: 'Lawyer Review' },
  { key: 'signed', label: 'Signed' },
]

const getStepStatus = (inspection: Inspection, stepKey: string) => {
  const statusOrder = ['requested', 'confirmed', 'lawyer-review', 'signed']
  const currentIndex = statusOrder.indexOf(inspection.status)
  const stepIndex = statusOrder.indexOf(stepKey)
  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'current'
  if (inspection.status === 'cancelled') return 'cancelled'
  return 'pending'
}

function renderProgressTracker(inspection: Inspection) {
  return (
    <div>
      {inspectionSteps.map((step, index) => {
        const stepStatus = 'completed' as const
        return <div key={step.key}>{step.label} {stepStatus}</div>
      })}
    </div>
  )
}

export function TestInspectionsPage() {
  const [inspections] = useState(tenantInspections)
  return (
    <div>
      {inspections.map((inspection) => (
        <div key={inspection.id}>
          {renderProgressTracker(inspection)}
        </div>
      ))}
    </div>
  )
}

import { useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui'
import { ProgressIndicator } from './ProgressIndicator'
import { ROLES } from './roles'
import { getOnboarding } from '../onboardingStore'

function getDashboardPath(roleId: string) {
  switch (roleId) {
    case 'landlord':
      return '/dashboard/landlord'
    case 'caretaker':
      return '/dashboard/caretaker'
    case 'lawyer':
      return '/dashboard/lawyer'
    case 'tenant':
    default:
      return '/dashboard'
  }
}

function VerificationCard({
  icon,
  title,
  description,
  action,
  isVerified,
  onToggle,
}: {
  icon: ReactNode
  title: string
  description: string
  action: string
  isVerified: boolean
  onToggle: () => void
}) {
  return (
    <div
      className="
        bg-white
        border border-green/15
        rounded-card
        p-6 sm:p-7
        flex flex-col sm:flex-row
        items-center sm:items-start
        gap-4 sm:gap-3
        transition-all
        duration-200
        hover:border-green/30
      "
    >
      <div className="flex items-center gap-3">
        <span className="h-10 w-10 rounded bg-green/10 flex items-center justify-center">
          {icon}
        </span>
        <div>
          <p className="font-semibold text-green-dark">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <Button
        size="md"
        variant="primary"
        className="mt-0 sm:mt-0 w-full sm:w-auto"
        onClick={onToggle}
      >
        {isVerified ? 'Verified' : action}
      </Button>
    </div>
  )
}

export function KycVerificationPage() {
  const data = getOnboarding()
  const role = ROLES.find((r) => r.id === data.role) ?? ROLES[0]
  const [ninVerified, setNinVerified] = useState(false)
  const [ownershipVerified, setOwnershipVerified] = useState(false)
  const [selfieVerified, setSelfieVerified] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F5F3EE] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <ProgressIndicator value={0.75} />

        <div className="rounded-card border border-green/20 bg-white p-7 md:p-9">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl font-bold text-green-dark md:text-5xl">Verification</h1>
              <p className="mt-3 text-sm text-gray-500">
                {role.label} · takes about 2 minutes
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-gray-300 bg-gray-100 px-4 py-1.5 text-xs font-bold uppercase text-gray-500">
              PENDING
            </span>
          </div>

          <div className="mt-6 space-y-3">
            <VerificationCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
                  <path d="M12 16V4m0 0L8 8m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
              title="NIN (National ID)"
              description="Checked against NIMC records"
              action="Upload"
              isVerified={ninVerified}
              onToggle={() => setNinVerified(true)}
            />

            <VerificationCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
                  <path
                    d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
              }
              title="Proof of ownership"
              description="C of O, deed of assignment or survey"
              action="Upload"
              isVerified={ownershipVerified}
              onToggle={() => setOwnershipVerified(true)}
            />

            <VerificationCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
                  <path
                    d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
              }
              title="Selfie verification"
              description="Live photo matched to your ID"
              action="Capture"
              isVerified={selfieVerified}
              onToggle={() => setSelfieVerified(true)}
            />
          </div>

          <div className="mt-6">
            <Button
              size="lg"
              fullWidth
              variant="primary"
              disabled={!(ninVerified && ownershipVerified && selfieVerified)}
              onClick={() => navigate(getDashboardPath(role.id))}
            >
              Continue
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Your NIN is checked against NIMC records and never shown to other users.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KycVerificationPage
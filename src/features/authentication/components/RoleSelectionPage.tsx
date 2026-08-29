import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui'
import { RoleGrid } from './RoleGrid'
import { ProgressIndicator } from './ProgressIndicator'
import { saveOnboarding } from '../onboardingStore'

export function RoleSelectionPage() {
  const [selected, setSelected] = useState('tenant')
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-cream px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <ProgressIndicator value={0.25} />

        <div className="mt-8">
          <Link to="/" aria-label="Rent Bridge home" className="block">
            <img
              src="/rentbridge-logo.png"
              alt="Rent Bridge"
              className="block"
              style={{ height: 220, width: 'auto', objectFit: 'contain' }}
            />
          </Link>

          <h1 className="mb-6 mt-[-64px] font-serif text-3xl font-bold text-green-dark md:text-4xl">I'm a...</h1>
          <RoleGrid selected={selected} onSelect={setSelected} />
          <Button
            fullWidth
            size="lg"
            className="mt-8"
            onClick={() => {
              saveOnboarding({ role: selected })
              navigate('/create-account')
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}

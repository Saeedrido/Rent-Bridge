import { useState, useNavigate } from 'react'
import { Button } from '../ui/Button'
import { cn } from '../utils/cn'

export function RoleSelectionPage() {
  const [role, setRole] = useState<'landlord' | 'caretaker' | 'lawyer' | 'tenant'>('tenant')
  const navigate = useNavigate()

  const handleContinue = () => {
    sessionStorage.setItem('rb:role', role)
    navigate(`/dashboard/${role}`)
  }

  return (
    <div className="min-h-screen bg-[#F5F3EE] px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-card border border-green/20 bg-white p-8 md:p-10">
          <h1 className="font-serif text-4xl font-bold text-green-dark mb-6">Select Your Role</h1>

          <div className="space-y-4">
            <Button
              onClick={() => setRole('landlord')}
              className="w-full justify-center"
              style={{ background: role === 'landlord' ? '#E4661F' : 'transparent', color: role === 'landlord' ? '#FFFFFF' : '#1B7A3E' }}
            >
              Landlord
            </Button>
            <Button
              onClick={() => setRole('caretaker')}
              className="w-full justify-center"
              style={{ background: role === 'caretaker' ? '#E4661F' : 'transparent', color: role === 'caretaker' ? '#FFFFFF' : '#1B7A3E' }}
            >
              Caretaker
            </Button>
            <Button
              onClick={() => setRole('lawyer')}
              className="w-full justify-center"
              style={{ background: role === 'lawyer' ? '#E4661F' : 'transparent', color: role === 'lawyer' ? '#FFFFFF' : '#1B7A3E' }}
            >
              Lawyer
            </Button>
            <Button
              onClick={() => setRole('tenant')}
              className="w-full justify-center"
              style={{ background: role === 'tenant' ? '#E4661F' : 'transparent', color: role === 'tenant' ? '#FFFFFF' : '#1B7A3E' }}
            >
              Tenant
            </Button>
          </div>

          <div className="mt-8">
            <Button
              onClick={handleContinue}
              size="lg"
              fullWidth
              variant="primary"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

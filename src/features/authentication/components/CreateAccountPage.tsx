import { useNavigate } from 'react-router-dom'
import { Button, Input, Field, PasswordInput } from '../../../components/ui'
import { ProgressIndicator } from './ProgressIndicator'
import { ROLES } from './roles'
import { getOnboarding } from '../onboardingStore'

export function CreateAccountPage() {
  const navigate = useNavigate()
  const onboardingData = getOnboarding()
  const storedRole = sessionStorage.getItem('rb:role')
  const roleId = onboardingData.role || storedRole || 'tenant'
  const roleEntry = ROLES.find((r) => r.id === roleId) ?? ROLES[0]

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/kyc-verification')
  }

  return (
    <div className="min-h-screen bg-[#F5F3EE] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <ProgressIndicator value={0.5} />

        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange">{roleEntry.label} Account</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-green-dark md:text-5xl">Create your account</h1>

          <form onSubmit={submit} className="mt-8 space-y-5 rounded-card border border-green/20 bg-white p-7 md:p-9">
            <Field label="Full name" labelClassName="text-green-dark font-semibold">
              <Input required defaultValue={onboardingData.fullName || 'Adaeze Okonkwo'} placeholder="Adaeze Okonkwo" autoComplete="name" />
            </Field>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Set password" labelClassName="text-green-dark font-semibold">
                <PasswordInput required defaultValue={onboardingData.password || ''} placeholder="••••••••" autoComplete="new-password" />
              </Field>
              <Field label="Confirm password" labelClassName="text-green-dark font-semibold">
                <PasswordInput required placeholder="••••••••" autoComplete="new-password" />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Location" labelClassName="text-green-dark font-semibold">
                <Input required placeholder="Yaba, Lagos" />
              </Field>
              <Field label="Phone number" labelClassName="text-green-dark font-semibold">
                <Input required placeholder="+234 802 445 1190" />
              </Field>
            </div>

            <Field label="Email" labelClassName="text-green-dark font-semibold">
              <Input type="email" required defaultValue={onboardingData.email || 'you@email.com'} placeholder="you@email.com" autoComplete="email" />
            </Field>

            <Button type="submit" fullWidth size="lg" className="mt-2">
              Create account &amp; continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

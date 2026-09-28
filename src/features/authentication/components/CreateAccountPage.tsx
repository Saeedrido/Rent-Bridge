import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Field, PasswordInput } from '../../../components/ui'
import { ProgressIndicator } from './ProgressIndicator'
import { ROLES } from './roles'
import { getOnboarding } from '../onboardingStore'
import { registerUser } from '../../../services/api/authApi'
import { apiErrorMessage } from '../../../services/api/fallback'
import { roleDashboardPath } from '../../../utils/roles'
import type { BackendRole } from '../../../services/api/tokens'

const roleToBackend: Record<string, BackendRole> = {
  tenant: 'Tenant',
  landlord: 'Landlord',
  caretaker: 'Caretaker',
  agent: 'Agent',
  lawyer: 'Lawyer',
}

export function CreateAccountPage() {
  const navigate = useNavigate()
  const onboardingData = getOnboarding()
  const storedRole = sessionStorage.getItem('rb:role')
  const roleId = onboardingData.role || storedRole || 'tenant'
  const roleEntry = ROLES.find((r) => r.id === roleId) ?? ROLES[0]
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget as HTMLFormElement)
    const password = String(data.get('password') || '')
    const confirm = String(data.get('confirmPassword') || '')

    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    const fullName = String(data.get('fullName') || '').trim()
    const spaceAt = fullName.indexOf(' ')
    const firstName = spaceAt === -1 ? fullName : fullName.slice(0, spaceAt)
    const lastName = spaceAt === -1 ? '' : fullName.slice(spaceAt + 1).trim()

    setSubmitting(true)
    try {
      await registerUser({
        email: String(data.get('email') || ''),
        phone: String(data.get('phone') || ''),
        firstName,
        lastName,
        role: roleToBackend[roleId] ?? 'Tenant',
        password,
        barNumber: roleId === 'lawyer' ? String(data.get('barNumber') || '') || undefined : undefined,
      })
      navigate(roleDashboardPath(roleId))
    } catch (err) {
      setError(apiErrorMessage(err) || 'Unable to create your account. Please try again.')
    } finally {
      setSubmitting(false)
    }
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
              <Input name="fullName" required defaultValue={onboardingData.fullName || 'Adaeze Okonkwo'} placeholder="Adaeze Okonkwo" autoComplete="name" />
            </Field>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Set password" labelClassName="text-green-dark font-semibold">
                <PasswordInput name="password" required defaultValue={onboardingData.password || ''} placeholder="••••••••" autoComplete="new-password" />
              </Field>
              <Field label="Confirm password" labelClassName="text-green-dark font-semibold">
                <PasswordInput name="confirmPassword" required placeholder="••••••••" autoComplete="new-password" />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Location" labelClassName="text-green-dark font-semibold">
                <Input name="location" required placeholder="Yaba, Lagos" />
              </Field>
              <Field label="Phone number" labelClassName="text-green-dark font-semibold">
                <Input name="phone" required placeholder="+234 802 445 1190" />
              </Field>
            </div>

            {roleId === 'lawyer' && (
              <Field label="Bar number" labelClassName="text-green-dark font-semibold">
                <Input name="barNumber" required placeholder="e.g. RC/001/2020" />
              </Field>
            )}

            <Field label="Email" labelClassName="text-green-dark font-semibold">
              <Input name="email" type="email" required defaultValue={onboardingData.email || 'you@email.com'} placeholder="you@email.com" autoComplete="email" />
            </Field>

            {error && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</p>}

            <Button type="submit" fullWidth size="lg" className="mt-2" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account & continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
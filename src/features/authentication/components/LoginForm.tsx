import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, PasswordInput, Field } from '../../../components/ui'
import { loginUser } from '../../../services/api/authApi'
import { getUser, normalizeRole } from '../../../services/api/tokens'
import { apiErrorMessage } from '../../../services/api/fallback'

function dashboardPathForRole(role: string): string {
  switch (role) {
    case 'landlord':
      return '/dashboard/landlord'
    case 'caretaker':
      return '/dashboard/caretaker'
    case 'lawyer':
      return '/dashboard/lawyer'
    case 'admin':
      return '/dashboard/admin'
    case 'tenant':
    default:
      return '/dashboard'
  }
}

export function LoginForm() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const email = String(data.get('email') || '')
    const password = String(data.get('password') || '')

    setError('')
    setSubmitting(true)
    try {
      await loginUser({ email, password })
      const user = getUser()
      navigate(dashboardPathForRole(normalizeRole(user?.role)))
    } catch (err) {
      setError(apiErrorMessage(err) || 'Unable to log in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="font-serif text-3xl font-bold text-green-dark">Welcome back</h1>
      <Field label="Email" labelClassName="text-green-dark">
        <Input name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
      </Field>
      <Field label="Password" labelClassName="text-green-dark">
        <PasswordInput name="password" required placeholder="••••••••" autoComplete="current-password" />
      </Field>
      {error && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</p>}
      <Button type="submit" fullWidth size="lg" disabled={submitting}>
        {submitting ? 'Logging in…' : 'Log in'}
      </Button>
    </form>
  )
}
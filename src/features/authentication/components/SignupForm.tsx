import { useNavigate } from 'react-router-dom'
import { Button, Input, Field, PasswordInput } from '../../../components/ui'
import { saveOnboarding } from '../onboardingStore'

export function SignupForm() {
  const navigate = useNavigate()
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    saveOnboarding({
      fullName: String(data.get('fullName') || ''),
      email: String(data.get('email') || ''),
      password: String(data.get('password') || ''),
    })
    navigate('/role-selection')
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="font-serif text-3xl font-bold text-green-dark">Create your account</h1>
      <Field label="Full name" labelClassName="text-green-dark">
        <Input name="fullName" required placeholder="Your name" autoComplete="name" />
      </Field>
      <Field label="Email" labelClassName="text-green-dark">
        <Input name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
      </Field>
      <Field label="Set password" labelClassName="text-green-dark">
        <PasswordInput name="password" required placeholder="••••••••" autoComplete="new-password" />
      </Field>
      <Button type="submit" fullWidth size="lg">
        Continue
      </Button>
    </form>
  )
}

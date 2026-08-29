import { useNavigate } from 'react-router-dom'
import { Button, Input, Field } from '../../../components/ui'

export function LoginForm() {
  const navigate = useNavigate()
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="font-serif text-3xl font-bold text-green-dark">Welcome back</h1>
      <Field label="Email" labelClassName="text-green-dark">
        <Input type="email" required placeholder="you@example.com" autoComplete="email" />
      </Field>
      <Field label="Password" labelClassName="text-green-dark">
        <Input type="password" required placeholder="••••••••" autoComplete="current-password" />
      </Field>
      <Button type="submit" fullWidth size="lg">
        Log in
      </Button>
    </form>
  )
}

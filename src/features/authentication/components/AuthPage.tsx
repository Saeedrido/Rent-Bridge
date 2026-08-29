import { useState } from 'react'
import { AuthLayout } from './AuthLayout'
import { AuthCard } from './AuthCard'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import { Seo } from '../../../components/common'

export type Mode = 'signup' | 'login'

export function AuthPage({ initialMode = 'signup' }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode)

  return (
    <>
      <Seo
        title={mode === 'signup' ? 'Create an account | Rent Bridge' : 'Log in | Rent Bridge'}
        description="Create or access your Rent Bridge account to manage viewings, saved homes and listings."
        path={mode === 'signup' ? '/register' : '/login'}
      />
      <AuthLayout>
        <AuthCard mode={mode} onModeChange={setMode}>
          {mode === 'signup' ? <SignupForm /> : <LoginForm />}
        </AuthCard>
        <p className="mt-5 text-center text-sm text-ink/60">
          {mode === 'signup' ? 'You’ll choose your role next.' : 'Logging in takes you straight to your dashboard.'}
        </p>
      </AuthLayout>
    </>
  )
}

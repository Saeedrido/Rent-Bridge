import type { ReactNode } from 'react'
import type { Mode } from './AuthPage'
import { AuthTabs } from './AuthTabs'

export function AuthCard({
  mode,
  onModeChange,
  children,
}: {
  mode: Mode
  onModeChange: (m: Mode) => void
  children: ReactNode
}) {
  return (
    <div className="w-full rounded-card border border-green/20 bg-white p-7 shadow-sm sm:p-8">
      <div className="mb-6">
        <AuthTabs mode={mode} onChange={onModeChange} />
      </div>
      {children}
    </div>
  )
}

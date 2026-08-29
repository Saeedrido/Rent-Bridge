import type { Mode } from './AuthPage'
import { cn } from '../../../utils/cn'

export function AuthTabs({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const tab = (key: Mode, label: string) => (
    <button
      type="button"
      onClick={() => onChange(key)}
      aria-pressed={mode === key}
      className={cn(
        'flex-1 rounded-md py-2.5 text-sm font-semibold transition-colors',
        mode === key ? 'bg-white text-green-dark shadow-sm' : 'bg-green/10 text-ink/60',
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="flex gap-1 rounded-lg bg-green/10 p-1">
      {tab('signup', 'Sign up')}
      {tab('login', 'Log in')}
    </div>
  )
}

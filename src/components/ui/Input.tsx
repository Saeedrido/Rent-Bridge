import type { InputHTMLAttributes, ReactNode } from 'react'
import { useState } from 'react'
import { cn } from '../../utils/cn'

interface FieldProps {
  label?: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
  labelClassName?: string
}

export function Field({ label, error, hint, children, className, labelClassName }: FieldProps) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className={cn('block text-sm font-medium text-ink mb-1.5', labelClassName)}>{label}</span>
      )}
      {children}
      {hint && !error && <span className="block text-xs text-ink/60 mt-1">{hint}</span>}
      {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
    </label>
  )
}

export function Input({ className, type = 'text', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'w-full rounded border border-green/20 bg-white px-3.5 py-2.5 text-ink text-[15px]',
        'placeholder:text-ink/40 focus:border-orange focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}

export function PasswordInput({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative">
      <Input
        type={showPassword ? 'text' : 'password'}
        className={cn('pr-12', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-orange transition-colors"
      >
        {showPassword ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  )
}
import type { InputHTMLAttributes, ReactNode } from 'react'
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

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded border border-green/20 bg-white px-3.5 py-2.5 text-ink text-[15px]',
        'placeholder:text-ink/40 focus:border-orange focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}

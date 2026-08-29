import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded border border-green/20 bg-white px-3.5 py-2.5 text-ink text-[15px]',
        'focus:border-orange focus:outline-none cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

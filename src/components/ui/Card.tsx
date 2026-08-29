import type { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-white border border-green/15 rounded-card overflow-hidden', className)}
      {...props}
    />
  )
}

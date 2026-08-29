import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-site px-7', className)}>{children}</div>
}

import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

type BadgeTone = 'orange' | 'green' | 'neutral'

const tones: Record<BadgeTone, string> = {
  orange: 'bg-orange text-white',
  green: 'bg-green text-white',
  neutral: 'bg-ink/10 text-ink',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[.06em] rounded px-2 py-1',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

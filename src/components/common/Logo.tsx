import { cn } from '../../utils/cn'

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/rentbridge-logo.png"
      alt="Rent Bridge"
      className={cn('block w-auto', className)}
    />
  )
}
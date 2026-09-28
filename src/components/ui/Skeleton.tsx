import { cn } from '../../utils/cn'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse bg-gray-200 rounded', className)}
      {...props}
    />
  )
}

export function SkeletonText({ lines = 3, className, ...props }: { lines?: number; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-xl border border-sage bg-white p-6', className)} {...props}>
      <Skeleton className="h-6 w-3/4 mb-4" />
      <SkeletonText lines={3} />
    </div>
  )
}

export function SkeletonPropertyCard() {
  return (
    <article className="group overflow-hidden rounded-card border border-green/15 bg-white">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
        <SkeletonText lines={2} />
      </div>
    </article>
  )
}

export function SkeletonDashboardPropertyCard() {
  return (
    <article className="anim-rise group flex flex-col overflow-hidden rounded-xl border border-sage bg-white">
      <Skeleton className="relative flex-shrink-0 aspect-[16/10] w-full" />
      <div className="flex flex-col flex-1 p-6 space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-8 w-1/3" />
        <SkeletonText lines={2} />
        <Skeleton className="my-5 h-px w-full" />
        <div className="mt-auto flex items-center justify-between gap-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-5 w-24 shrink-0" />
        </div>
      </div>
    </article>
  )
}

export function SkeletonPropertyGallery() {
  return (
    <div>
      <Skeleton className="overflow-hidden rounded-card border border-green/15 bg-[#E7E2D8]" style={{ height: 420 }} />
      <div className="mt-3 flex gap-3 overflow-x-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-28 flex-shrink-0 overflow-hidden rounded border-2" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonListingView({ count = 6 } = {}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPropertyCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, columns = 4 } = {}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-5 w-24" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid gap-4">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton key={`${row}-${col}`} className="h-5 w-24" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonForm({ fields = 5 } = {}) {
  return (
    <div className="space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonDetailPage() {
  return (
    <div className="space-y-8">
      <SkeletonPropertyGallery />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}
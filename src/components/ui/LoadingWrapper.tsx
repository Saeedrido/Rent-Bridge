import { ReactNode } from 'react'
import { useSectionLoader } from '../../hooks/useLoading.tsx'
import { SkeletonListingView, SkeletonDashboardPropertyCard, SkeletonPropertyGallery, SkeletonDetailPage, SkeletonTable, SkeletonForm, SkeletonCard } from './Skeleton'

interface LoadingWrapperProps {
  sectionId: string
  children?: ReactNode
  skeleton?: ReactNode
  fallback?: ReactNode
}

export function LoadingWrapper({ sectionId, children, skeleton, fallback }: LoadingWrapperProps) {
  const { isLoading } = useSectionLoader(sectionId)

  if (isLoading) {
    return skeleton ?? fallback ?? <DefaultSkeleton />
  }

  return <>{children}</>
}

function DefaultSkeleton() {
  return <div className="animate-pulse space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
}

export function PropertyCardSkeleton({ count = 6 } = {}) {
  return <LoadingWrapper sectionId="properties" skeleton={<SkeletonListingView count={count} />} />
}

export function DashboardPropertyCardSkeleton({ count = 4 } = {}) {
  return (
    <LoadingWrapper 
      sectionId="dashboard-properties" 
      skeleton={
        <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonDashboardPropertyCard key={i} />
          ))}
        </div>
      } 
    />
  )
}

export function PropertyGallerySkeleton() {
  return <LoadingWrapper sectionId="property-gallery" skeleton={<SkeletonPropertyGallery />} />
}

export function PropertyDetailSkeleton() {
  return <LoadingWrapper sectionId="property-detail" skeleton={<SkeletonDetailPage />} />
}

export function TableSkeleton({ rows = 5, columns = 4 } = {}) {
  return <LoadingWrapper sectionId="table" skeleton={<SkeletonTable rows={rows} columns={columns} />} />
}

export function FormSkeleton({ fields = 5 } = {}) {
  return <LoadingWrapper sectionId="form" skeleton={<SkeletonForm fields={fields} />} />
}
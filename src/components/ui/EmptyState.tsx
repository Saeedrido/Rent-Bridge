import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="text-center py-16 px-6">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green/10 text-green">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 11l8-6 8 6v9H4z" />
          <path d="M10 20v-6h4v6" />
        </svg>
      </div>
      <h3 className="font-serif text-xl font-semibold text-green-dark">{title}</h3>
      {description && <p className="mt-2 text-ink/60 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

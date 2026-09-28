import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAccessToken, getUser } from '../services/api/tokens'
import { SectionLoadingProvider } from '../hooks/useLoading'
import { ToastProvider } from '../features/dashboard/roleDashboards/shared'

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const signedIn = Boolean(getAccessToken() || getUser())
  if (!signedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return (
    <SectionLoadingProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </SectionLoadingProvider>
  )
}

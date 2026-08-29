import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { DashboardHeader } from './components/DashboardHeader'
import { ToastProvider } from './components/ToastProvider'

export function DashboardLayout() {
  useEffect(() => {
    // SessionStorage sync for legacy tenant/agent dashboards
    const storedRole = sessionStorage.getItem('rb:role')
    if (!storedRole) {
      sessionStorage.setItem('rb:role', 'tenant')
    }
  }, [])

  return (
    <ToastProvider>
      <div className="min-h-screen bg-cream">
        <DashboardHeader />
        <main style={{ paddingTop: 130 }}>
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  )
}
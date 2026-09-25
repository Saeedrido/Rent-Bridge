import { Outlet } from 'react-router-dom'
import { DashboardHeader } from './components/DashboardHeader'
import { ToastProvider } from './components/ToastProvider'

export function DashboardLayout() {
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
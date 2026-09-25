import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { App } from './App'
import { AuthPage } from '../features/authentication/components/AuthPage'
import { RoleSelectionPage } from '../features/authentication/components/RoleSelectionPage'
import { CreateAccountPage } from '../features/authentication/components/CreateAccountPage'
import { DashboardLayout } from '../features/dashboard/DashboardLayout'
import KycVerificationPage from '../features/authentication/components/KycVerificationPage'
import { TenantDashboard } from '../features/dashboard/DashboardPages'
import { AgentDashboard } from '../features/dashboard/DashboardPages'
import { LandlordCaretakerDashboard } from '../features/dashboard/roleDashboards/LandlordCaretakerDashboard'
import { LawyerDashboard } from '../features/dashboard/roleDashboards/LawyerDashboard'
import { AdminDashboard } from '../features/dashboard/roleDashboards/AdminDashboard'
import { PublishPropertyPage } from '../features/dashboard/roleDashboards/PublishPropertyPage'
import { SettingsPage } from '../features/dashboard/settings/SettingsPage'
import NotFoundPage from '../features/common/NotFoundPage'
import { Spinner } from '../components/ui'
import { RequireAuth } from './RequireAuth'

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Spinner className="h-8 w-8" />}>{children}</Suspense>
)

const HomePage = lazy(() => import('../pages/Home/HomePage'))
const PropertiesPage = lazy(() => import('../pages/Properties/PropertiesPage'))
const PropertyDetailsPage = lazy(() => import('../pages/PropertyDetails/PropertyDetailsPage'))
const BuyPage = lazy(() => import('../pages/Buy/BuyPage'))
const RentPage = lazy(() => import('../pages/Rent/RentPage'))
const FavoritesPage = lazy(() => import('../pages/Favorites/FavoritesPage'))
const TenantPropertyDetailsPage = lazy(() => import('../features/dashboard/tenant/TenantPropertyDetailsPage'))
const TenantAgreementPageLazy = lazy(() => import('../features/dashboard/tenant/TenantAgreementPage').then(m => ({ default: m.TenantAgreementPage })))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <SuspenseWrapper><HomePage /></SuspenseWrapper> },
      { path: 'properties', element: <SuspenseWrapper><PropertiesPage /></SuspenseWrapper> },
      { path: 'properties/:slug', element: <SuspenseWrapper><PropertyDetailsPage /></SuspenseWrapper> },
      { path: 'buy', element: <SuspenseWrapper><BuyPage /></SuspenseWrapper> },
      { path: 'rent', element: <SuspenseWrapper><RentPage /></SuspenseWrapper> },
      { path: 'favorites', element: <SuspenseWrapper><FavoritesPage /></SuspenseWrapper> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/dashboard', element: <RequireAuth><DashboardLayout /></RequireAuth>, children: [
    { index: true, element: <SuspenseWrapper><TenantDashboard /></SuspenseWrapper> },
    { path: 'agent', element: <SuspenseWrapper><AgentDashboard /></SuspenseWrapper> },
    { path: 'inspections', element: <SuspenseWrapper><TenantDashboard /></SuspenseWrapper> },
    { path: 'payments', element: <SuspenseWrapper><TenantDashboard /></SuspenseWrapper> },
    { path: 'saved', element: <SuspenseWrapper><TenantDashboard /></SuspenseWrapper> },
    { path: 'agreement', element: <SuspenseWrapper><TenantDashboard /></SuspenseWrapper> },
    { path: 'settings', element: <SuspenseWrapper><TenantDashboard /></SuspenseWrapper> },
    { path: 'agent/settings', element: <SuspenseWrapper><AgentDashboard /></SuspenseWrapper> },
    { path: 'properties/:id', element: <SuspenseWrapper><TenantPropertyDetailsPage /></SuspenseWrapper> },
    { path: 'agreement/:id', element: <SuspenseWrapper><TenantAgreementPageLazy /></SuspenseWrapper> },
  ]},
  { path: '/dashboard/landlord', element: <RequireAuth><LandlordCaretakerDashboard role="landlord" /></RequireAuth> },
  { path: '/dashboard/caretaker', element: <RequireAuth><LandlordCaretakerDashboard role="caretaker" /></RequireAuth> },
  { path: '/dashboard/lawyer', element: <RequireAuth><LawyerDashboard /></RequireAuth> },
  { path: '/dashboard/admin', element: <RequireAuth><AdminDashboard /></RequireAuth> },
  { path: '/dashboard/landlord/publish', element: <RequireAuth><PublishPropertyPage role="landlord" /></RequireAuth> },
  { path: '/dashboard/caretaker/publish', element: <RequireAuth><PublishPropertyPage role="caretaker" /></RequireAuth> },
  { path: '/dashboard/landlord/settings', element: <RequireAuth><SettingsPage role="landlord" /></RequireAuth> },
  { path: '/dashboard/caretaker/settings', element: <RequireAuth><SettingsPage role="caretaker" /></RequireAuth> },
  { path: '/login', element: <AuthPage initialMode="login" /> },
  { path: '/register', element: <AuthPage initialMode="signup" /> },
  { path: '/role-selection', element: <RoleSelectionPage /> },
  { path: '/create-account', element: <CreateAccountPage /> },
  { path: '/kyc-verification', element: <KycVerificationPage /> },
])
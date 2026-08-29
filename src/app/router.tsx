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
import { PublishPropertyPage } from '../features/dashboard/roleDashboards/PublishPropertyPage'
import NotFoundPage from '../features/common/NotFoundPage'
import { Spinner } from '../components/ui'

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
  { path: '/dashboard', element: <DashboardLayout />, children: [
    { index: true, element: <SuspenseWrapper><TenantDashboard /></SuspenseWrapper> },
    { path: 'agent', element: <SuspenseWrapper><AgentDashboard /></SuspenseWrapper> },
    { path: 'inspections', element: <SuspenseWrapper><TenantDashboard /></SuspenseWrapper> },
    { path: 'payments', element: <SuspenseWrapper><TenantDashboard /></SuspenseWrapper> },
    { path: 'saved', element: <SuspenseWrapper><TenantDashboard /></SuspenseWrapper> },
    { path: 'agreement', element: <SuspenseWrapper><TenantDashboard /></SuspenseWrapper> },
    { path: 'profile', element: <SuspenseWrapper><TenantDashboard /></SuspenseWrapper> },
    { path: 'properties/:id', element: <SuspenseWrapper><TenantPropertyDetailsPage /></SuspenseWrapper> },
    { path: 'agreement/:id', element: <SuspenseWrapper><TenantAgreementPageLazy /></SuspenseWrapper> },
  ]},
  { path: '/dashboard/landlord', element: <LandlordCaretakerDashboard role="landlord" /> },
  { path: '/dashboard/caretaker', element: <LandlordCaretakerDashboard role="caretaker" /> },
  { path: '/dashboard/lawyer', element: <LawyerDashboard /> },
  { path: '/dashboard/landlord/publish', element: <PublishPropertyPage role="landlord" /> },
  { path: '/dashboard/caretaker/publish', element: <PublishPropertyPage role="caretaker" /> },
  { path: '/login', element: <AuthPage initialMode="login" /> },
  { path: '/register', element: <AuthPage initialMode="signup" /> },
  { path: '/role-selection', element: <RoleSelectionPage /> },
  { path: '/create-account', element: <CreateAccountPage /> },
  { path: '/kyc-verification', element: <KycVerificationPage /> },
])
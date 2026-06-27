import { createBrowserRouter } from 'react-router-dom'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { GoogleAuthPage } from './pages/GoogleAuthPage'
import { InternalLoginPage } from './pages/InternalLoginPage'
import { AdminPage } from './pages/AdminPage'
import { VendedorPage } from './pages/VendedorPage'
import { RequireInternalAuth } from './guards/RouteGuards'

export const router = createBrowserRouter([
  { index: true, element: <AuthPage /> },
  { path: '/auth-google', element: <GoogleAuthPage /> },
  { path: '/login', element: <InternalLoginPage /> },
  { path: '/dashboard', element: <RequireInternalAuth><DashboardPage /></RequireInternalAuth> },
  { path: '/admin', element: <RequireInternalAuth roles={[ 'admin' ]}><AdminPage /></RequireInternalAuth> },
  { path: '/vendedor', element: <RequireInternalAuth roles={[ 'seller' ]}><VendedorPage /></RequireInternalAuth> },
])

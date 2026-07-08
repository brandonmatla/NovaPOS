import { createBrowserRouter } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { GoogleAuthPage } from './pages/GoogleAuthPage'
import { InternalLoginPage } from './pages/InternalLoginPage'
import { AdminPage } from './pages/AdminPage'
import { VendedorPage } from './pages/VendedorPage'
import { AuthGuard } from './guards/AuthGuard'

export const router = createBrowserRouter([
  {
    element: <AuthGuard />,
    children: [
      { path: '/auth/google', element: <GoogleAuthPage /> },
      { path: '/login', element: <InternalLoginPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/admin', element: <AdminPage /> },
      { path: '/vendedor', element: <VendedorPage /> },
      { path: '*', element: <AuthGuard /> },
    ],
  },
])

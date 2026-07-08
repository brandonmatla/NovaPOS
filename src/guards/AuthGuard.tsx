import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthContext } from '../contexts/authContext'

const PUBLIC_ROUTES = new Set(['/auth/google', '/login'])
const AUTHENTICATED_HOME_BY_ROLE = {
  admin: '/admin',
  seller: '/vendedor',
} as const

const isRootPath = (pathname: string): boolean => pathname === '/' || pathname === ''

const isKnownRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.has(pathname) || pathname === '/dashboard' || pathname === '/admin' || pathname === '/vendedor'
}

const getAuthenticatedHome = (role?: 'admin' | 'seller' | null): string => {
  return role === 'admin' ? AUTHENTICATED_HOME_BY_ROLE.admin : AUTHENTICATED_HOME_BY_ROLE.seller
}

export const AuthGuard = () => {
  const location = useLocation()
  const { authState, googleSession, internalUser, retryGoogleDriveSync } = useAuthContext()

  if (authState === 'LOADING' ) {
    return (
      <div className="auth-page">
        <div className="auth-background" />
        <div className="auth-content">
          <div className="login-container">
            <div className="login-card">
              <div className="login-card__header">
                <div className="logo">
                  <div className="logo-icon">NP</div>
                  <div className="logo-text">NovaPOS</div>
                </div>
              </div>
              <div className="login-card__content">
                <h1 className="login-title">Inicializando NovaPOS</h1>
                <p className="login-subtitle">Verificando Google, SQLite y empresa.db.</p>
                <div className="login-card__body">
                  <button type="button" className="primary-button" disabled>
                    Cargando...
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (authState === 'ERROR') {
    return (
      <div className="auth-page">
        <div className="auth-background" />
        <div className="auth-content">
          <div className="login-container">
            <div className="login-card">
              <div className="login-card__header">
                <div className="logo">
                  <div className="logo-icon">NP</div>
                  <div className="logo-text">NovaPOS</div>
                </div>
              </div>
              <div className="login-card__content">
                <h1 className="login-title">No se pudo inicializar NovaPOS</h1>
                <p className="login-subtitle">Hay un problema con Google Drive o la base de datos local.</p>
                <div className="login-card__body">
                  {googleSession ? (
                    <button type="button" className="primary-button" onClick={retryGoogleDriveSync}>
                      Reintentar sincronización
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!googleSession) {
    if (location.pathname !== '/auth/google') {
      return <Navigate to="/auth/google" replace />
    }

    return <Outlet />
  }

  if (authState === 'GOOGLE_REQUIRED') {
    if (location.pathname !== '/auth/google') {
      return <Navigate to="/auth/google" replace />
    }

    return <Outlet />
  }

  if (authState === 'LOGIN_REQUIRED') {
    if (location.pathname !== '/login') {
      return <Navigate to="/login" replace />
    }

    return <Outlet />
  }

  if (authState === 'AUTHENTICATED') {
    if (!isKnownRoute(location.pathname) || isRootPath(location.pathname) || PUBLIC_ROUTES.has(location.pathname)) {
      return <Navigate to={getAuthenticatedHome(internalUser?.role ?? null)} replace />
    }

    return <Outlet />
  }

  return <Outlet />
}
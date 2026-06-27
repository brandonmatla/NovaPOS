import type { ReactNode } from 'react'

interface LoginCardProps {
  children: ReactNode
  isLoading?: boolean
  error?: string | null
  onDismissError?: () => void
}

export const LoginCard = ({ children, isLoading = false, error, onDismissError }: LoginCardProps) => {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-card__header">
          <div className="logo">
            <div className="logo-icon">NP</div>
            <div className="logo-text">NovaPOS</div>
          </div>
        </div>

        <div className="login-card__content">
          <h1 className="login-title">Nueva generación de punto de venta</h1>
          <p className="login-subtitle">
            Administra tu negocio de forma local, segura y con respaldos en tu propia cuenta de Google Drive.
          </p>

          {error && (
            <div className="error-banner">
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="error-content">
                <p className="error-text">{error}</p>
                {onDismissError && (
                  <button type="button" className="error-dismiss" onClick={onDismissError}>
                    Descartar
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="login-card__body" aria-busy={isLoading} aria-disabled={isLoading}>
            {children}
          </div>
        </div>

        <div className="login-card__footer">
          <p className="login-footer-text">Conexión segura con Google Identity Services</p>
        </div>
      </div>
    </div>
  )
}

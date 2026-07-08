import React, { useEffect, useState } from 'react'
import { useAuthContext } from '../contexts/authContext'

export const InternalLoginPage = () => {
  const { signInInternal, internalUser, changeInternalPassword, googleSession, syncStatus, syncError, retryGoogleDriveSync } = useAuthContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  useEffect(() => {
    setMustChangePassword(Boolean(internalUser?.mustChangePassword))
  }, [internalUser?.mustChangePassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const user = await signInInternal(email, password)

      if (user.mustChangePassword) {
        setMustChangePassword(true)
        return
      }
    } catch (err) {
      setError((err as Error).message || 'Error al autenticar')
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!newPassword || newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }

    try {
      await changeInternalPassword(newPassword)
      setMustChangePassword(false)
      setPassword('')
      setNewPassword('')
    } catch (err) {
      setError((err as Error).message || 'No se pudo cambiar la contraseña')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-background" />
      <div className="auth-content">
        <div className="login-container">
          {googleSession && syncStatus === 'syncing' && (
            <div className="sync-snackbar sync-snackbar--info" role="status" aria-live="polite">
              <span className="spinner sync-snackbar__spinner" />
              <div className="sync-snackbar__content">
                <p className="sync-snackbar__title">Sincronizando empresa.db</p>
                <p className="sync-snackbar__text">La navegación ya está disponible mientras Drive termina su trabajo.</p>
              </div>
            </div>
          )}

          {googleSession && syncStatus === 'error' && syncError && (
            <div className="sync-snackbar sync-snackbar--error" role="alert" aria-live="assertive">
              <div className="sync-snackbar__content">
                <p className="sync-snackbar__title">No se pudo sincronizar Google Drive</p>
                <p className="sync-snackbar__text">{syncError}</p>
              </div>
              <button type="button" className="sync-snackbar__action" onClick={retryGoogleDriveSync}>
                Reintentar
              </button>
            </div>
          )}

          <div className="login-card">
            <div className="login-card__header">
              <div className="logo">
                <div className="logo-icon">NP</div>
                <div className="logo-text">NovaPOS</div>
              </div>
            </div>

            <div className="login-card__content">
              <h1 className="login-title">Ingresa a tu negocio</h1>
              <p className="login-subtitle">
                {mustChangePassword ? 'Debes cambiar tu contraseña para continuar.' : 'Accede con tu usuario y contraseña.'}
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
                  </div>
                </div>
              )}

              {!mustChangePassword ? (
                <form onSubmit={handleSubmit} className="login-form">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Usuario" type="text" autoFocus />
                  <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" type="password" />
                  <button className="primary-button" type="submit">Entrar</button>
                </form>
              ) : (
                <form onSubmit={handlePasswordChange} className="login-form">
                  <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contraseña" type="password" autoFocus />
                  <button className="primary-button" type="submit">Cambiar contraseña</button>
                </form>
              )}
            </div>

            <div className="login-card__footer">
              <p className="login-footer-text">Sesión segura con sincronización en Google Drive</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

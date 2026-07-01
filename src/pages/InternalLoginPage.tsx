import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../contexts/authContext'

export const InternalLoginPage = () => {
  const navigate = useNavigate()
  const { signInInternal, internalUser, changeInternalPassword } = useAuthContext()
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

      if (user.role === 'admin') navigate('/admin', { replace: true })
      else navigate('/vendedor', { replace: true })
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
      if (internalUser?.role === 'admin') navigate('/admin', { replace: true })
      else navigate('/vendedor', { replace: true })
    } catch (err) {
      setError((err as Error).message || 'No se pudo cambiar la contraseña')
    }
  }

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

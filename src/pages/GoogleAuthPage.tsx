import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuthContext } from '../contexts/authContext'

type GoogleTokenResponse = {
  access_token?: string
  expires_in?: number
}

export const GoogleAuthPage = () => {
  const navigate = useNavigate()
  const { googleSession, signInWithGoogleToken } = useAuthContext()

  useEffect(() => {
    if (googleSession) {
      navigate('/login', { replace: true })
    }
  }, [googleSession, navigate])

  const login = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid profile email https://www.googleapis.com/auth/drive.file',
    onSuccess: async (tokenResponse) => {
      const { access_token: accessToken, expires_in: expiresIn } = tokenResponse as GoogleTokenResponse
      if (!accessToken) return
      await signInWithGoogleToken(accessToken, expiresIn ?? 3600)
    },
    onError: (err) => {
      console.error('Google login error', err)
    },
  })

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
              <h1 className="login-title">Conecta tu cuenta de Google</h1>
              <p className="login-subtitle">Sincroniza tu negocio en Google Drive de forma segura.</p>

              <div className="login-card__body">
                <button className="primary-button google-signin-button" onClick={() => login()}>
                  Continuar con Google
                </button>
              </div>

              <p className="auth-terms">Al continuar, aceptas los Términos de Servicio y la Política de Privacidad de NovaPOS.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

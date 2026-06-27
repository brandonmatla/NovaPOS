import { useEffect, useState } from 'react'
import { authService } from '../services/authService'
import type { AuthState, GoogleAuthSession } from '../types/auth'

const initialState: AuthState = {
  googleSession: null,
  isAuthenticated: false,
}

const getFriendlyErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('popup_closed_by_user') || message.includes('user cancelled') || message.includes('cancelled') || message.includes('aborted')) {
      return 'Inicio de sesión cancelado. Por favor intenta de nuevo.'
    }

    if (message.includes('invalid_client')) {
      return 'Configuración de Google incorrecta. Revisa tu client ID y origen.'
    }

    if (message.includes('networkerror') || message.includes('network error')) {
      return 'Error de red. Verifica tu conexión e intenta nuevamente.'
    }

    return error.message
  }

  return 'Error desconocido al iniciar sesión.'
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const googleSession = authService.restoreGoogleSession()

    setAuthState({
      googleSession,
      isAuthenticated: Boolean(googleSession),
    })
  }, [])

  const signInWithGoogle = async (accessToken: string, expiresIn: number): Promise<GoogleAuthSession | null> => {
    setLoading(true)
    setError(null)

    try {
      const session = await authService.signInWithGoogle(accessToken, expiresIn)
      authService.persistGoogleSession(session)
      setAuthState({
        googleSession: session,
        isAuthenticated: true,
      })
      return session
    } catch (err) {
      setError(getFriendlyErrorMessage(err))
      return null
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    authService.clearSession()
    setAuthState(initialState)
    setError(null)
  }

  const dismissError = () => {
    setError(null)
  }

  return {
    authState,
    loading,
    error,
    signInWithGoogle,
    signOut,
    dismissError,
  }
}

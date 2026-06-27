import { useGoogleLogin } from '@react-oauth/google'

interface GoogleButtonProps {
  onSuccess: (accessToken: string, expiresIn: number) => void
  onError: (error: Error) => void
  isLoading?: boolean
}

const getFriendlyError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'object' && error !== null && 'error' in error) {
    const message = (error as { error: unknown }).error
    return new Error(typeof message === 'string' ? message : 'Error desconocido de Google')
  }

  return new Error('Error desconocido de Google')
}

export const GoogleButton = ({ onSuccess, onError, isLoading = false }: GoogleButtonProps) => {
  const login = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid profile email https://www.googleapis.com/auth/drive.file',
    onSuccess: (tokenResponse) => {
      const accessToken = (tokenResponse as any).access_token as string | undefined
      const expiresIn = (tokenResponse as any).expires_in as number | undefined

      if (!accessToken) {
        onError(new Error('No se recibió token de acceso de Google.'))
        return
      }

      onSuccess(accessToken, expiresIn ?? 3600)
    },
    onError: (error) => {
      onError(getFriendlyError(error))
    },
  })

  return (
    <button type="button" className="primary-button google-signin-button" onClick={() => login()} disabled={isLoading}>
      {isLoading ? 'Conectando con Google...' : 'Continuar con Google'}
    </button>
  )
}

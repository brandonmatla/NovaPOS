import type { GoogleAuthSession } from '../types/auth'
import type { InternalUser } from '../services/DatabaseService'
import { STORAGE_KEYS } from '../utils/constants'

const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
const DEFAULT_EXPIRES_IN = 3600

type GoogleProfile = {
  email: string
  name: string
  picture?: string
}

const fetchGoogleProfile = async (accessToken: string): Promise<GoogleProfile> => {
  const response = await fetch(USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('No se pudo obtener la información del perfil de Google.')
  }

  return response.json() as Promise<GoogleProfile>
}

export const authService = {
  async signInWithGoogle(accessToken: string, expiresIn: number): Promise<GoogleAuthSession> {
    if (!accessToken) {
      throw new Error('No se recibió el token de acceso de Google.')
    }

    const profile = await fetchGoogleProfile(accessToken)

    const session: GoogleAuthSession = {
      accessToken,
      tokenExpiresAt: Date.now() + (expiresIn || DEFAULT_EXPIRES_IN) * 1000,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    }

    return session
  },

  persistGoogleSession(session: GoogleAuthSession): void {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_SESSION, JSON.stringify(session))
  },

  restoreGoogleSession(): GoogleAuthSession | null {
    const raw = localStorage.getItem(STORAGE_KEYS.GOOGLE_SESSION)
    if (!raw) return null

    return JSON.parse(raw) as GoogleAuthSession
  },

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.GOOGLE_SESSION)
  },

  persistInternalSession(user: InternalUser): void {
    localStorage.setItem(STORAGE_KEYS.INTERNAL_USER, JSON.stringify(user))
  },

  restoreInternalSession(): InternalUser | null {
    const raw = localStorage.getItem(STORAGE_KEYS.INTERNAL_USER)
    if (!raw) return null

    return JSON.parse(raw) as InternalUser
  },

  clearInternalSession(): void {
    localStorage.removeItem(STORAGE_KEYS.INTERNAL_USER)
  },
}

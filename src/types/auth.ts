export interface GoogleAuthSession {
  accessToken: string
  tokenExpiresAt: number
  email: string
  name: string
  picture?: string
}

export interface AuthState {
  googleSession: GoogleAuthSession | null
  isAuthenticated: boolean
}

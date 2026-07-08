import { createContext, useContext } from 'react'
import type { GoogleAuthSession } from '../types/auth'
import type { InternalUser } from '../services/DatabaseService'

export type AuthState = 'LOADING' | 'GOOGLE_REQUIRED' | 'DATABASE_INITIALIZING' | 'LOGIN_REQUIRED' | 'AUTHENTICATED' | 'ERROR'

export type SyncStatus = 'loading' | 'syncing' | 'ready' | 'error'

export type AuthContextValue = {
  googleSession: GoogleAuthSession | null
  internalAuthenticated: boolean
  internalUser: InternalUser | null
  authState: AuthState
  bootstrapError: string | null
  syncStatus: SyncStatus
  syncError: string | null
  initializeApp: () => Promise<void>
  signInWithGoogleToken: (accessToken: string, expiresIn: number) => Promise<void>
  retryGoogleDriveSync: () => void
  signInInternal: (email: string, password: string) => Promise<InternalUser>
  changeInternalPassword: (password: string) => Promise<void>
  signOutInternal: () => Promise<void>
  switchGoogleAccount: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext debe usarse dentro de AuthProvider')
  return ctx
}
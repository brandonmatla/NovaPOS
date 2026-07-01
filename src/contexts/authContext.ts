import { createContext, useContext } from 'react'
import type { GoogleAuthSession } from '../types/auth'
import type { InternalUser } from '../services/DatabaseService'

export type AuthContextValue = {
  googleSession: GoogleAuthSession | null
  internalAuthenticated: boolean
  internalUser: InternalUser | null
  initializeApp: () => Promise<void>
  signInWithGoogleToken: (accessToken: string, expiresIn: number) => Promise<void>
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
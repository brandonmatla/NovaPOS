import React, { createContext, useContext, useEffect, useState } from 'react'
import type { GoogleAuthSession } from '../types/auth'
import { authService } from '../services/authService'
import { DriveSyncService } from '../services/DriveSyncService'
import { DatabaseServiceImpl } from '../services/DatabaseService'
import type { InternalUser } from '../services/DatabaseService'

type AuthContextValue = {
  googleSession: GoogleAuthSession | null
  internalAuthenticated: boolean
  internalUser: InternalUser | null
  initializeApp: () => Promise<void>
  signInWithGoogleToken: (accessToken: string, expiresIn: number) => Promise<void>
  signInInternal: (email: string, password: string) => Promise<InternalUser>
  signOutInternal: () => Promise<void>
  switchGoogleAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext debe usarse dentro de AuthProvider')
  return ctx
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [googleSession, setGoogleSession] = useState<GoogleAuthSession | null>(null)
  const [internalAuthenticated, setInternalAuthenticated] = useState(false)
  const [internalUser, setInternalUser] = useState<InternalUser | null>(null)

  useEffect(() => {
    const session = authService.restoreGoogleSession()
    if (session) {
      // Validate if session is still valid (not expired)
      const now = Date.now()
      if (now < session.tokenExpiresAt) {
        // Session valid, restore it
        setGoogleSession(session)
      } else {
        // Session expired, clean it up
        authService.clearSession()
        setGoogleSession(null)
      }
    }
  }, [])

  const initializeApp = async () => {
    // Called on app start to ensure DB and drive sync depending on session
    const session = authService.restoreGoogleSession()
    if (!session) return

    try {
      const remote = await DriveSyncService.findEmpresaDb(session.accessToken)
      if (remote) {
        const blob = await DriveSyncService.downloadFile(remote.id, session.accessToken)
        await DatabaseServiceImpl.importDatabase(blob)
      } else {
        const hasLocal = await DatabaseServiceImpl.hasLocalDatabase()
        if (!hasLocal) {
          await DatabaseServiceImpl.initialize()
          const exported = await DatabaseServiceImpl.exportDatabase()
          await DriveSyncService.uploadFile(exported, session.accessToken)
        } else {
          const exported = await DatabaseServiceImpl.exportDatabase()
          await DriveSyncService.uploadFile(exported, session.accessToken)
        }
      }
    } catch (err) {
      console.error('Drive sync failed on init', err)
    }
  }

  const signInWithGoogleToken = async (accessToken: string, expiresIn: number) => {
    const session = await authService.signInWithGoogle(accessToken, expiresIn)
    authService.persistGoogleSession(session)
    setGoogleSession(session)
  }

  const signInInternal = async (email: string, _password: string) => {
    // Authenticate against local DB
    const user = await DatabaseServiceImpl.findInternalUserByEmail(email)
    if (!user) throw new Error('Usuario no encontrado')
    setInternalUser(user)
    setInternalAuthenticated(true)
    return user
  }

  const signOutInternal = async () => {
    // Persist pending changes and sync with Drive
    try {
      if (!googleSession) {
        setInternalAuthenticated(false)
        setInternalUser(null)
        return
      }

      const exported = await DatabaseServiceImpl.exportDatabase()
      await DriveSyncService.uploadFile(exported, googleSession.accessToken)
    } catch (err) {
      console.error('Sync failed during signOutInternal', err)
      throw err
    }

    setInternalAuthenticated(false)
    setInternalUser(null)
  }

  const switchGoogleAccount = async () => {
    // Remove google session and token
    authService.clearSession()
    setGoogleSession(null)
    // Also clear any internal state
    setInternalAuthenticated(false)
    setInternalUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ googleSession, internalAuthenticated, internalUser, initializeApp, signInWithGoogleToken, signInInternal, signOutInternal, switchGoogleAccount }}
    >
      {children}
    </AuthContext.Provider>
  )
}

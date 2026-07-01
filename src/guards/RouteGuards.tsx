import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../contexts/authContext'
import { authService } from '../services/authService'

export const RequireInternalAuth: React.FC<{ children: React.ReactNode; roles?: ('admin' | 'seller')[] }> = ({ children, roles }) => {
  const { internalAuthenticated, internalUser } = useAuthContext()
  const restoredUser = authService.restoreInternalSession()
  const activeUser = internalUser ?? restoredUser
  const isAuthenticated = internalAuthenticated || Boolean(restoredUser)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && roles.length > 0) {
    if (!activeUser) return <Navigate to="/login" replace />
    if (!roles.includes(activeUser.role)) return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export const RequireGoogleSession: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { googleSession } = useAuthContext()
  if (!googleSession) return <Navigate to="/auth-google" replace />
  return <>{children}</>
}

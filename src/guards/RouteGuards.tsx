import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'

export const RequireInternalAuth: React.FC<{ children: React.ReactNode; roles?: ('admin' | 'seller')[] }> = ({ children, roles }) => {
  const { internalAuthenticated, internalUser } = useAuthContext()

  if (!internalAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && roles.length > 0) {
    if (!internalUser) return <Navigate to="/login" replace />
    if (!roles.includes(internalUser.role)) return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export const RequireGoogleSession: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { googleSession } = useAuthContext()
  if (!googleSession) return <Navigate to="/auth-google" replace />
  return <>{children}</>
}

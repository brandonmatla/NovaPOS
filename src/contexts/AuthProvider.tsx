import React, { useCallback, useMemo, useState } from 'react'
import type { GoogleAuthSession } from '../types/auth'
import { authService } from '../services/authService'
import { DriveSyncService } from '../services/DriveSyncService'
import { DatabaseServiceImpl } from '../services/DatabaseService'
import type { InternalUser } from '../services/DatabaseService'
import { AuthContext } from './authContext'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [googleSession, setGoogleSession] = useState<GoogleAuthSession | null>(() => {
    const session = authService.restoreGoogleSession()
    if (!session) return null

    return Date.now() < session.tokenExpiresAt ? session : null
  })
  const [internalUser, setInternalUser] = useState<InternalUser | null>(() => authService.restoreInternalSession())
  const [internalAuthenticated, setInternalAuthenticated] = useState<boolean>(() => Boolean(authService.restoreInternalSession()))

  const syncFromDrive = useCallback(async (session: GoogleAuthSession) => {
    await DatabaseServiceImpl.initialize()

    const remoteFile = await DriveSyncService.findEmpresaDb(session.accessToken)
    const localSnapshot = await DatabaseServiceImpl.getLocalSnapshot()

    if (!remoteFile) {
      const exported = await DatabaseServiceImpl.exportDatabase()
      await DriveSyncService.uploadFile(exported, session.accessToken)
      return
    }

    const remoteMeta = await DriveSyncService.getFileMeta(remoteFile.id, session.accessToken)
    const remoteModified = remoteMeta.modifiedTime ?? remoteFile.modifiedTime ?? null
    const remoteTimestamp = remoteModified ? new Date(remoteModified).getTime() : 0
    const localTimestamp = localSnapshot.lastSavedAt ? new Date(localSnapshot.lastSavedAt).getTime() : 0

    if (!localSnapshot.lastSavedAt || remoteTimestamp > localTimestamp) {
      const blob = await DriveSyncService.downloadFile(remoteFile.id, session.accessToken)
      await DatabaseServiceImpl.importDatabase(blob)
      return
    }

    const exported = await DatabaseServiceImpl.exportDatabase()
    await DriveSyncService.uploadFile(exported, session.accessToken, remoteFile.id)
  }, [])

  const pushToDrive = useCallback(async (session: GoogleAuthSession) => {
    await DatabaseServiceImpl.initialize()

    const remoteFile = await DriveSyncService.findEmpresaDb(session.accessToken)
    const exported = await DatabaseServiceImpl.exportDatabase()
    const uploaded = await DriveSyncService.uploadFile(exported, session.accessToken, remoteFile?.id)
    const localSnapshot = await DatabaseServiceImpl.getLocalSnapshot()

    await DatabaseServiceImpl.updateSyncState({
      source: 'local',
      localModifiedAt: localSnapshot.lastSavedAt ?? new Date().toISOString(),
      remoteModifiedAt: uploaded.modifiedTime ?? remoteFile?.modifiedTime ?? null,
      conflictResolution: 'local-wins',
      detail: 'Sincronización al cerrar sesión',
    })
  }, [])

  const initializeApp = useCallback(async () => {
    const session = authService.restoreGoogleSession()
    if (!session) return

    if (Date.now() >= session.tokenExpiresAt) {
      authService.clearSession()
      setGoogleSession(null)
      return
    }

    setGoogleSession(session)
    await syncFromDrive(session)
  }, [syncFromDrive])

  const signInWithGoogleToken = useCallback(async (accessToken: string, expiresIn: number) => {
    const session = await authService.signInWithGoogle(accessToken, expiresIn)
    authService.persistGoogleSession(session)
    setGoogleSession(session)
    await syncFromDrive(session)
  }, [syncFromDrive])

  const signInInternal = useCallback(async (email: string, password: string) => {
    const user = await DatabaseServiceImpl.authenticateInternalUser(email, password)
    authService.persistInternalSession(user)
    setInternalUser(user)
    setInternalAuthenticated(true)
    return user
  }, [])

  const changeInternalPassword = useCallback(async (password: string) => {
    if (!internalUser) {
      throw new Error('No hay un usuario autenticado')
    }

    await DatabaseServiceImpl.changeUserPassword(internalUser.id, password, false)
    const updatedUser = await DatabaseServiceImpl.findInternalUserByEmail(internalUser.email)

    if (!updatedUser) {
      throw new Error('No se pudo actualizar el usuario')
    }

    setInternalUser(updatedUser)
    authService.persistInternalSession(updatedUser)
  }, [internalUser])

  const signOutInternal = useCallback(async () => {
    try {
      if (!googleSession || !internalUser) {
        setInternalAuthenticated(false)
        setInternalUser(null)
        authService.clearInternalSession()
        return
      }

      await pushToDrive(googleSession)
    } catch (err) {
      console.error('Sync failed during signOutInternal', err)
      throw err
    }

    setInternalAuthenticated(false)
    setInternalUser(null)
    authService.clearInternalSession()
  }, [googleSession, internalUser, pushToDrive])

  const switchGoogleAccount = useCallback(async () => {
    authService.clearSession()
    setGoogleSession(null)
    setInternalAuthenticated(false)
    setInternalUser(null)
    authService.clearInternalSession()
  }, [])

  const value = useMemo(
    () => ({
      googleSession,
      internalAuthenticated,
      internalUser,
      initializeApp,
      signInWithGoogleToken,
      signInInternal,
      changeInternalPassword,
      signOutInternal,
      switchGoogleAccount,
    }),
    [
      googleSession,
      internalAuthenticated,
      internalUser,
      initializeApp,
      signInWithGoogleToken,
      signInInternal,
      changeInternalPassword,
      signOutInternal,
      switchGoogleAccount,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
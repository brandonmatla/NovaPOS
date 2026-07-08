import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GoogleAuthSession } from '../types/auth'
import { authService } from '../services/authService'
import { DriveSyncService } from '../services/DriveSyncService'
import { DatabaseServiceImpl } from '../services/DatabaseService'
import type { InternalUser } from '../services/DatabaseService'
import { AuthContext, type AuthState, type SyncStatus } from './authContext'

let initializeAppPromise: Promise<void> | null = null

const OPERATION_TIMEOUT_MS = 100_000

const goToLogin = (): void => {
  if (window.location.pathname === '/login') {
    return
  }

  window.history.pushState({}, '', '/login')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const getSyncErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  return 'No se pudo sincronizar con Google Drive.'
}

const withTimeout = async <T,>(task: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  try {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} tardó más de ${timeoutMs / 1000} segundos`)), timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const restoredGoogleSession = authService.restoreGoogleSession()
  const restoredInternalUser = authService.restoreInternalSession()

  const [googleSession, setGoogleSession] = useState<GoogleAuthSession | null>(() => {
    if (!restoredGoogleSession) return null

    return Date.now() < restoredGoogleSession.tokenExpiresAt ? restoredGoogleSession : null
  })
  const [internalUser, setInternalUser] = useState<InternalUser | null>(() => restoredInternalUser)
  const [internalAuthenticated, setInternalAuthenticated] = useState<boolean>(() => Boolean(restoredInternalUser))
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('ready')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [bootstrapStatus, setBootstrapStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const driveSyncPromiseRef = useRef<Promise<void> | null>(null)
  const driveSyncRunIdRef = useRef(0)

  const syncFromDrive = useCallback(async (session: GoogleAuthSession) => {
    console.log('Paso 1: syncFromDrive:start')
    console.log('Paso 2: DatabaseServiceImpl.initialize:start')
    await DatabaseServiceImpl.initialize()

    console.log('Paso 3: DatabaseServiceImpl.initialize:done')

    console.log('Paso 4: DriveSyncService.findEmpresaDb:start')
    const remoteFile = await DriveSyncService.findEmpresaDb(session.accessToken)
    console.log('Paso 5: DriveSyncService.findEmpresaDb:done')
    const localSnapshot = await DatabaseServiceImpl.getLocalSnapshot()

    if (!remoteFile) {
      console.log('Paso 6: empresa.db no existe, creando y subiendo')
      const exported = await DatabaseServiceImpl.exportDatabase()
      await DriveSyncService.uploadFile(exported, session.accessToken)
      console.log('Paso 7: syncFromDrive:completed-create')
      return
    }

    const remoteMeta = await DriveSyncService.getFileMeta(remoteFile.id, session.accessToken)
    const remoteModified = remoteMeta.modifiedTime ?? remoteFile.modifiedTime ?? null
    const remoteTimestamp = remoteModified ? new Date(remoteModified).getTime() : 0
    const localTimestamp = localSnapshot.lastSavedAt ? new Date(localSnapshot.lastSavedAt).getTime() : 0

    if (!localSnapshot.lastSavedAt || remoteTimestamp > localTimestamp) {
      const blob = await DriveSyncService.downloadFile(remoteFile.id, session.accessToken)
      await DatabaseServiceImpl.importDatabase(blob)
      console.log('Paso 7: syncFromDrive:completed-download')
      return
    }

    const exported = await DatabaseServiceImpl.exportDatabase()
    await DriveSyncService.uploadFile(exported, session.accessToken, remoteFile.id)
    console.log('Paso 7: syncFromDrive:completed-upload')
  }, [])

  const startDriveSync = useCallback(
    (session: GoogleAuthSession) => {
      if (driveSyncPromiseRef.current) {
        return driveSyncPromiseRef.current
      }

      const runId = ++driveSyncRunIdRef.current
      setSyncStatus('syncing')
      setSyncError(null)

      const task = (async () => {
        try {
          await withTimeout(syncFromDrive(session), OPERATION_TIMEOUT_MS, 'La sincronización con Google Drive')
          if (driveSyncRunIdRef.current === runId) {
            setSyncStatus('ready')
            setSyncError(null)
          }
        } catch (error) {
          console.error('Google Drive sync failed', error)
          setSyncStatus('error')
          setSyncError(getSyncErrorMessage(error))
        }
      finally {
        if (driveSyncRunIdRef.current === runId) {
          driveSyncPromiseRef.current = null
        }
      }
    })()

  driveSyncPromiseRef.current = task
  return task
},
  [syncFromDrive],
  )

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
  if (initializeAppPromise) {
    await initializeAppPromise
    return
  }

  initializeAppPromise = (async () => {
    try {
      console.log('Paso 1: initializeApp:start')
      setBootstrapStatus('loading')
      setBootstrapError(null)
      setSyncStatus('loading')
      setSyncError(null)

      const session = authService.restoreGoogleSession()
      console.log('Paso 2: restoreGoogleSession', Boolean(session))
      if (!session) {
        setGoogleSession(null)
        setSyncStatus('ready')
        setBootstrapStatus('ready')
        console.log('Paso 5: initializeApp:completed-no-google')
        return
      }

      if (Date.now() >= session.tokenExpiresAt) {
        authService.clearSession()
        setGoogleSession(null)
        setSyncStatus('ready')
        setBootstrapStatus('ready')
        console.log('Paso 5: initializeApp:expired-google')
        return
      }

      setGoogleSession(session)
      console.log('Paso 3: Google válida, inicializando SQLite')

      await withTimeout(DatabaseServiceImpl.initialize(), OPERATION_TIMEOUT_MS, 'Inicializar SQLite')
      console.log('Paso 4: SQLite lista, lanzando sync de Drive en segundo plano')
      setBootstrapStatus('ready')
      void startDriveSync(session)
    } catch (error) {
      console.error('SQLite bootstrap failed', error)
      setBootstrapStatus('error')
      setBootstrapError(getSyncErrorMessage(error))
      setSyncStatus('error')
      setSyncError(getSyncErrorMessage(error))
    } finally {
      console.log('Paso 5: initializeApp:finally')
      console.log('APP READY')
    }
  })().finally(() => {
    initializeAppPromise = null
  })

  await initializeAppPromise
}, [startDriveSync])

useEffect(() => {
  if (bootstrapStatus !== 'ready') {
    return
  }

  if (!googleSession) {
    setSyncStatus('ready')
    return
  }

  if (syncStatus === 'ready' || syncStatus === 'syncing') {
    return
  }

  setSyncStatus('ready')
}, [bootstrapStatus, googleSession, syncStatus])

const signInWithGoogleToken = useCallback(async (accessToken: string, expiresIn: number) => {
  const session = await authService.signInWithGoogle(accessToken, expiresIn);

  authService.persistGoogleSession(session);

  setGoogleSession(session);

  // ENTRAR AL LOGIN INMEDIATAMENTE
  goToLogin();

  // La sincronización ocurre en segundo plano
  void startDriveSync(session);

}, [startDriveSync])

const retryGoogleDriveSync = useCallback(() => {
  if (!googleSession) {
    return
  }

  void startDriveSync(googleSession)
}, [googleSession, startDriveSync])

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

const authState: AuthState = useMemo(() => {
  if (bootstrapStatus === 'loading' && !googleSession) return 'LOADING'
  if (bootstrapStatus === 'error') return 'ERROR'
  if (!googleSession) return 'GOOGLE_REQUIRED'
  if (!internalAuthenticated || internalUser?.mustChangePassword) return 'LOGIN_REQUIRED'
  return 'AUTHENTICATED'
}, [bootstrapStatus, googleSession, internalAuthenticated, internalUser?.mustChangePassword, syncStatus])

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
    authState,
    bootstrapError,
    syncStatus,
    syncError,
    initializeApp,
    signInWithGoogleToken,
    retryGoogleDriveSync,
    signInInternal,
    changeInternalPassword,
    signOutInternal,
    switchGoogleAccount,
  }),
  [
    googleSession,
    internalAuthenticated,
    internalUser,
    authState,
    bootstrapError,
    syncStatus,
    syncError,
    initializeApp,
    signInWithGoogleToken,
    retryGoogleDriveSync,
    signInInternal,
    changeInternalPassword,
    signOutInternal,
    switchGoogleAccount,
  ],
)

return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
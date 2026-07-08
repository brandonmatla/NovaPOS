const DRIVE_FILES_API = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files'
const SQLITE_MIME = 'application/x-sqlite3'
const DEFAULT_RETRY_ATTEMPTS = 3
const DEFAULT_RETRY_DELAY_MS = 350

type DriveFile = {
  id: string
  name: string
  modifiedTime?: string
  size?: string
}

type SyncOutcome =
  | { status: 'created' | 'uploaded' | 'unchanged'; file: DriveFile }
  | { status: 'downloaded'; file: DriveFile; blob: Blob }

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

const parseTimestamp = (value?: string | null): number => {
  if (!value) return 0
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

const isRetryableStatus = (status: number): boolean => status === 408 || status === 429 || status >= 500

const isRetryableError = (error: unknown): boolean => error instanceof TypeError || error instanceof DOMException

const readDriveError = async (response: Response): Promise<string> => {
  try {
    const payload = await response.json() as { error?: { message?: string } }
    const message = payload.error?.message
    if (message) {
      return message
    }
  } catch {
    // Ignore JSON parsing failures and fall back to status text.
  }

  return response.statusText || 'Error inesperado de Google Drive'
}

const fetchWithRetry = async (url: string, init: RequestInit, label: string, attempts = DEFAULT_RETRY_ATTEMPTS): Promise<Response> => {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, init)

      if (response.ok || !isRetryableStatus(response.status) || attempt === attempts) {
        return response
      }

      lastError = new Error(await readDriveError(response))
    } catch (error) {
      lastError = error

      if (!isRetryableError(error) || attempt === attempts) {
        break
      }
    }

    await sleep(DEFAULT_RETRY_DELAY_MS * attempt)
  }

  const reason = lastError instanceof Error ? lastError.message : 'No se pudo completar la operación'
  throw new Error(`${label}: ${reason}`)
}

const createMultipartBody = (blob: Blob, metadata: Record<string, unknown>): { body: Blob; boundary: string } => {
  const boundary = `drive-boundary-${crypto.randomUUID().replace(/-/g, '')}`
  const body = new Blob(
    [
      `--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      '\r\n',
      `--${boundary}\r\n`,
      `Content-Type: ${blob.type || SQLITE_MIME}\r\n\r\n`,
      blob,
      '\r\n',
      `--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` },
  )

  return { body, boundary }
}

const pickNewestFile = (files: DriveFile[]): DriveFile | null => {
  if (!files.length) return null

  return [...files].sort((left, right) => parseTimestamp(right.modifiedTime) - parseTimestamp(left.modifiedTime))[0] ?? null
}

export const DriveSyncService = {
  async findEmpresaDb(accessToken: string): Promise<DriveFile | null> {
    const q = encodeURIComponent("name='empresa.db' and trashed=false")
    const url = `${DRIVE_FILES_API}?q=${q}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc&pageSize=100`
    const response = await fetchWithRetry(url, { headers: { Authorization: `Bearer ${accessToken}` } }, 'No se pudo buscar empresa.db en Google Drive')

    if (!response.ok) {
      throw new Error(await readDriveError(response))
    }

    const data = (await response.json()) as { files?: DriveFile[] }
    return pickNewestFile(data.files ?? [])
  },

  async downloadFile(fileId: string, accessToken: string): Promise<Blob> {
    if (!fileId) {
      throw new Error('No se recibió el identificador del archivo de Drive')
    }

    const url = `${DRIVE_FILES_API}/${fileId}?alt=media`
    const response = await fetchWithRetry(url, { headers: { Authorization: `Bearer ${accessToken}` } }, 'No se pudo descargar empresa.db desde Google Drive')

    if (!response.ok) {
      throw new Error(await readDriveError(response))
    }

    return await response.blob()
  },

  async uploadFile(blob: Blob, accessToken: string, fileId?: string): Promise<DriveFile> {
    if (!blob) {
      throw new Error('No se recibió el archivo para subir a Google Drive')
    }

    const metadata = {
      name: 'empresa.db',
      mimeType: SQLITE_MIME,
    }

    const { body } = createMultipartBody(blob, metadata)
    const url = fileId ? `${DRIVE_UPLOAD_API}/${fileId}?uploadType=multipart&fields=id,name,modifiedTime,size` : `${DRIVE_UPLOAD_API}?uploadType=multipart&fields=id,name,modifiedTime,size`
    const method = fileId ? 'PATCH' : 'POST'

    const response = await fetchWithRetry(
      url,
      {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': body.type,
        },
        body,
      },
      fileId ? 'No se pudo actualizar empresa.db en Google Drive' : 'No se pudo crear empresa.db en Google Drive',
    )

    if (!response.ok) {
      throw new Error(await readDriveError(response))
    }

    return (await response.json()) as DriveFile
  },

  async getFileMeta(fileId: string, accessToken: string): Promise<DriveFile> {
    if (!fileId) {
      throw new Error('No se recibió el identificador del archivo de Drive')
    }

    const url = `${DRIVE_FILES_API}/${fileId}?fields=id,name,modifiedTime,size`
    const response = await fetchWithRetry(url, { headers: { Authorization: `Bearer ${accessToken}` } }, 'No se pudo obtener metadata de empresa.db en Google Drive')

    if (!response.ok) {
      throw new Error(await readDriveError(response))
    }

    return (await response.json()) as DriveFile
  },

  async ensureRemoteSynced(localBlob: Blob | null, accessToken: string, localModifiedAt: string | null = null): Promise<SyncOutcome> {
    const remoteFile = await this.findEmpresaDb(accessToken)

    if (!remoteFile) {
      if (!localBlob) {
        const empty = new Blob([], { type: SQLITE_MIME })
        const created = await this.uploadFile(empty, accessToken)
        return { status: 'created', file: created }
      }

      const uploaded = await this.uploadFile(localBlob, accessToken)
      return { status: 'created', file: uploaded }
    }

    if (!localBlob || !localModifiedAt) {
      return { status: 'unchanged', file: remoteFile }
    }

    const remoteMeta = await this.getFileMeta(remoteFile.id, accessToken)
    const remoteTimestamp = parseTimestamp(remoteMeta.modifiedTime ?? remoteFile.modifiedTime ?? null)
    const localTimestamp = parseTimestamp(localModifiedAt)

    if (localTimestamp > remoteTimestamp) {
      const uploaded = await this.uploadFile(localBlob, accessToken, remoteFile.id)
      return { status: 'uploaded', file: uploaded }
    }

    if (remoteTimestamp > localTimestamp) {
      const blob = await this.downloadFile(remoteFile.id, accessToken)
      return { status: 'downloaded', file: remoteMeta, blob }
    }

    return { status: 'unchanged', file: remoteMeta }
  },
}

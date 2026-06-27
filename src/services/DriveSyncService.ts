const DRIVE_FILES_API = 'https://www.googleapis.com/drive/v3/files'

export const DriveSyncService = {
  async findEmpresaDb(accessToken: string) {
    const q = encodeURIComponent("name='empresa.db' and trashed=false")
    const url = `${DRIVE_FILES_API}?q=${q}&fields=files(id,name,modifiedTime,size)`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!res.ok) throw new Error('No se pudo buscar en Google Drive')
    const data = await res.json()
    return data.files && data.files[0] ? data.files[0] : null
  },

  async downloadFile(fileId: string, accessToken: string) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!res.ok) throw new Error('Error al descargar archivo de Drive')
    const blob = await res.blob()
    return blob
  },

  async uploadFile(blob: Blob, accessToken: string, fileId?: string) {
    // Simple multipart upload. If fileId provided, update existing file via PATCH
    const metadata = {
      name: 'empresa.db',
      mimeType: 'application/x-sqlite3',
    }

    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', blob)

    const base = 'https://www.googleapis.com/upload/drive/v3/files'
    const url = fileId ? `${base}/${fileId}?uploadType=multipart` : `${base}?uploadType=multipart`
    const method = fileId ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    })

    if (!res.ok) {
      throw new Error('Error al subir empresa.db a Drive')
    }

    return res.json()
  },

  async getFileMeta(fileId: string, accessToken: string) {
    const url = `${DRIVE_FILES_API}/${fileId}?fields=id,name,modifiedTime,size`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!res.ok) throw new Error('No se pudo obtener metadata de Drive')
    return res.json()
  },

  async ensureRemoteSynced(localBlob: Blob | null, accessToken: string) {
    const remote = await this.findEmpresaDb(accessToken)
    if (!remote) {
      if (!localBlob) {
        // Nothing local to upload, create empty DB
        const empty = new Blob([new ArrayBuffer(0)], { type: 'application/x-sqlite3' })
        return await this.uploadFile(empty, accessToken)
      }
      return await this.uploadFile(localBlob, accessToken)
    }

    // If remote exists, compare dates handled by caller
    return remote
  },
}

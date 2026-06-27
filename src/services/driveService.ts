const DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'

export const driveService = {
  async findBackupFile(accessToken: string, fileName: string) {
    const query = encodeURIComponent(`name='${fileName}' and mimeType='application/x-sqlite3' and trashed=false`)
    const response = await fetch(`${DRIVE_API_BASE_URL}/files?q=${query}&spaces=drive&fields=files(id,name,mimeType)`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('No se pudo consultar los archivos en Google Drive')
    }

    const payload = await response.json()
    return payload.files?.[0] ?? null
  },

  async uploadBackupFile(accessToken: string, file: Blob, fileName: string) {
    const metadata = {
      name: fileName,
      mimeType: 'application/x-sqlite3',
    }

    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', file)

    const response = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    })

    if (!response.ok) {
      throw new Error('Error al subir el archivo a Google Drive')
    }

    return response.json()
  },

  async downloadBackupFile(accessToken: string, fileId: string) {
    const response = await fetch(`${DRIVE_API_BASE_URL}/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Error al descargar el archivo desde Google Drive')
    }

    return response.blob()
  },
}

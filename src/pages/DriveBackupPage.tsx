import { useState } from 'react'
import { driveService } from '../services/driveService'
import type { GoogleAuthSession } from '../types/auth'

interface DriveBackupPageProps {
  googleSession: GoogleAuthSession
}

export const DriveBackupPage = ({ googleSession }: DriveBackupPageProps) => {
  const [status, setStatus] = useState<string>('')

  const handleUpload = async () => {
    setStatus('Preparando archivo para subir...')

    const blob = new Blob(['SQLite backup placeholder'], { type: 'application/x-sqlite3' })

    try {
      const result = await driveService.uploadBackupFile(googleSession.accessToken, blob, 'empresa.db')
      setStatus(`Archivo subido con ID ${result.id}`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Error desconocido al subir')
    }
  }

  const handleDownload = async () => {
    setStatus('Buscando archivo en Google Drive...')

    try {
      const file = await driveService.findBackupFile(googleSession.accessToken, 'empresa.db')
      if (!file) {
        setStatus('No se encontró empresa.db en Drive')
        return
      }

      const blob = await driveService.downloadBackupFile(googleSession.accessToken, file.id)
      setStatus(`Archivo descargado: ${file.name} (${blob.size} bytes)`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Error desconocido al descargar')
    }
  }

  return (
    <section className="drive-page">
      <h2>Backups en Google Drive</h2>
      <p>Usuario conectado: {googleSession.email}</p>
      <div className="drive-actions">
        <button className="primary-button" type="button" onClick={handleUpload}>
          Subir empresa.db
        </button>
        <button className="primary-button" type="button" onClick={handleDownload}>
          Descargar empresa.db
        </button>
      </div>
      <p>{status}</p>
    </section>
  )
}

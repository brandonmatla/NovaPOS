export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
}

export interface GoogleAuthSession {
  idToken: string
  accessToken: string
  tokenExpiresAt: number
  email: string
  name: string
  picture?: string
}

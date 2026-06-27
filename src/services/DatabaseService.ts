export type UserRole = 'admin' | 'seller'

export interface InternalUser {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
}

export interface DatabaseService {
  initialize(): Promise<void>
  hasLocalDatabase(): Promise<boolean>
  importDatabase(blob: Blob): Promise<void>
  exportDatabase(): Promise<Blob>
  findInternalUserByEmail(email: string): Promise<InternalUser | null>
  upsertInternalUser(user: InternalUser): Promise<void>
}

// For now use the sqlite stub
import { createDatabaseService } from './../database/sqlite'

export const DatabaseServiceImpl: DatabaseService = createDatabaseService()

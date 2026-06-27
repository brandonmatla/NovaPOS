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
  // Backwards compat
  getInternalUserByEmail(email: string): Promise<InternalUser | null>
  saveInternalUser(user: InternalUser): Promise<void>
}

export const createDatabaseService = (): DatabaseService => {
  let dbBlob: Blob | null = null
  const users = new Map<string, InternalUser>()

  // Initialize with default users for testing
  const defaultAdmin: InternalUser = {
    id: 'admin-001',
    email: 'admin',
    name: 'Administrador',
    role: 'admin',
    createdAt: new Date().toISOString(),
  }
  const defaultSeller: InternalUser = {
    id: 'seller-001',
    email: 'vendedor',
    name: 'Vendedor',
    role: 'seller',
    createdAt: new Date().toISOString(),
  }
  users.set('admin', defaultAdmin)
  users.set('vendedor', defaultSeller)

  return {
    async initialize() {
      // In a real implementation, open or create SQLite file here.
      return Promise.resolve()
    },

    async hasLocalDatabase() {
      return Promise.resolve(!!dbBlob)
    },

    async importDatabase(blob: Blob) {
      dbBlob = blob
      // parse blob to populate users in a real impl; here keep as-is
      return Promise.resolve()
    },

    async exportDatabase() {
      return Promise.resolve(dbBlob ?? new Blob([new ArrayBuffer(0)], { type: 'application/x-sqlite3' }))
    },

    async findInternalUserByEmail(email: string) {
      return Promise.resolve(users.get(email) ?? null)
    },

    async upsertInternalUser(user: InternalUser) {
      users.set(user.email, user)
      return Promise.resolve()
    },

    // Backwards compat
    async getInternalUserByEmail(email: string) {
      return this.findInternalUserByEmail(email)
    },

    async saveInternalUser(user: InternalUser) {
      return this.upsertInternalUser(user)
    },
  }
}

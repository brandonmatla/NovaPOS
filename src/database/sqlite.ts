import initSqlJs, { type Database as SqlJsDatabase, type SqlJsStatic } from 'sql.js'
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { hashPassword, sha256Hex, verifyPassword } from '../utils/crypto'

export type UserRole = 'admin' | 'seller'

export interface InternalUser {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
  mustChangePassword: boolean
}

export interface LocalSnapshot {
  lastSavedAt: string | null
  checksum: string | null
}

export interface DatabaseService {
  initialize(): Promise<void>
  hasLocalDatabase(): Promise<boolean>
  importDatabase(blob: Blob): Promise<void>
  exportDatabase(): Promise<Blob>
  getLocalSnapshot(): Promise<LocalSnapshot>
  findInternalUserByEmail(email: string): Promise<InternalUser | null>
  authenticateInternalUser(email: string, password: string): Promise<InternalUser>
  saveInternalUser(user: InternalUser, password: string): Promise<void>
  changeUserPassword(userId: string, password: string, mustChangePassword?: boolean): Promise<void>
  setUserMustChangePassword(userId: string, mustChangePassword: boolean): Promise<void>
  updateSyncState(input: SyncStateInput): Promise<void>
  transaction<T>(action: (db: SqlJsDatabase) => Promise<T> | T): Promise<T>
}

type SyncStateInput = {
  source: 'local' | 'drive' | 'seed'
  localModifiedAt: string
  remoteModifiedAt: string | null
  conflictResolution: 'local-wins' | 'remote-wins' | 'seeded' | 'none'
  detail: string
}

type PersistedDatabase = {
  blob: Blob
  checksum: string
  lastSavedAt: string
}

const DATABASE_FILE_NAME = 'empresa.db'
const DATABASE_STORE_NAME = 'novapos.sqlite'
const DATABASE_STORE = 'files'
const DATABASE_KEY = 'empresa.db'
const SQLITE_FILE_MIME = 'application/x-sqlite3'
const ROOT_COMPANY_ID = 'empresa-novapos'
const ROLE_ADMIN_ID = 'role-admin'
const ROLE_SELLER_ID = 'role-seller'
const DEFAULT_ADMIN_ID = 'user-admin'
const DEFAULT_SELLER_ID = 'user-seller'

const MIGRATION_STATEMENTS: Array<{ version: number; statements: string[] }> = [
  {
    version: 1,
    statements: [
      'PRAGMA foreign_keys = ON;',
      `CREATE TABLE IF NOT EXISTS empresa (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        razon_social TEXT,
        rfc TEXT,
        logo_url TEXT,
        telefono TEXT,
        email TEXT,
        direccion TEXT,
        activo INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT,
        activo INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        usuario TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        email TEXT,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        password_iterations INTEGER NOT NULL DEFAULT 310000,
        must_change_password INTEGER NOT NULL DEFAULT 1,
        activo INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login_at TEXT,
        FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT
      );`,
      `CREATE TABLE IF NOT EXISTS categorias (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        nombre TEXT NOT NULL,
        slug TEXT NOT NULL,
        activo INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON UPDATE CASCADE ON DELETE CASCADE,
        UNIQUE (empresa_id, slug)
      );`,
      `CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        categoria_id TEXT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        codigo TEXT NOT NULL,
        codigo_barras TEXT,
        imagen_url TEXT,
        precio_compra REAL NOT NULL DEFAULT 0,
        precio_venta REAL NOT NULL DEFAULT 0,
        stock REAL NOT NULL DEFAULT 0,
        stock_minimo REAL NOT NULL DEFAULT 0,
        activo INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON UPDATE CASCADE ON DELETE SET NULL,
        UNIQUE (empresa_id, codigo),
        UNIQUE (empresa_id, codigo_barras)
      );`,
      `CREATE TABLE IF NOT EXISTS extras (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio REAL NOT NULL DEFAULT 0,
        activo INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON UPDATE CASCADE ON DELETE CASCADE,
        UNIQUE (empresa_id, nombre)
      );`,
      `CREATE TABLE IF NOT EXISTS producto_extra (
        producto_id TEXT NOT NULL,
        extra_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (producto_id, extra_id),
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (extra_id) REFERENCES extras(id) ON UPDATE CASCADE ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        nombre TEXT NOT NULL,
        documento TEXT,
        telefono TEXT,
        email TEXT,
        direccion TEXT,
        activo INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON UPDATE CASCADE ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS ventas (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        usuario_id TEXT NOT NULL,
        cliente_id TEXT,
        numero TEXT NOT NULL,
        fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        subtotal REAL NOT NULL DEFAULT 0,
        iva REAL NOT NULL DEFAULT 0,
        descuento REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        metodo_pago TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'abierta',
        notas TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON UPDATE CASCADE ON DELETE SET NULL,
        UNIQUE (empresa_id, numero)
      );`,
      `CREATE TABLE IF NOT EXISTS detalle_venta (
        id TEXT PRIMARY KEY,
        venta_id TEXT NOT NULL,
        producto_id TEXT NOT NULL,
        cantidad REAL NOT NULL,
        precio_unitario REAL NOT NULL,
        subtotal REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (venta_id) REFERENCES ventas(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON UPDATE CASCADE ON DELETE RESTRICT
      );`,
      `CREATE TABLE IF NOT EXISTS detalle_extra (
        id TEXT PRIMARY KEY,
        detalle_venta_id TEXT NOT NULL,
        extra_id TEXT NOT NULL,
        cantidad REAL NOT NULL,
        precio_unitario REAL NOT NULL,
        subtotal REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (detalle_venta_id) REFERENCES detalle_venta(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (extra_id) REFERENCES extras(id) ON UPDATE CASCADE ON DELETE RESTRICT
      );`,
      `CREATE TABLE IF NOT EXISTS inventario (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        producto_id TEXT NOT NULL,
        stock_actual REAL NOT NULL DEFAULT 0,
        stock_minimo REAL NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON UPDATE CASCADE ON DELETE CASCADE,
        UNIQUE (empresa_id, producto_id)
      );`,
      `CREATE TABLE IF NOT EXISTS movimientos_stock (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        producto_id TEXT NOT NULL,
        usuario_id TEXT NOT NULL,
        tipo TEXT NOT NULL,
        cantidad REAL NOT NULL,
        referencia TEXT,
        motivo TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
      );`,
      `CREATE TABLE IF NOT EXISTS caja (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        usuario_id TEXT NOT NULL,
        estado TEXT NOT NULL,
        apertura_at TEXT NOT NULL,
        cierre_at TEXT,
        saldo_inicial REAL NOT NULL DEFAULT 0,
        saldo_final REAL,
        diferencia REAL,
        observaciones TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
      );`,
      `CREATE TABLE IF NOT EXISTS movimientos_caja (
        id TEXT PRIMARY KEY,
        caja_id TEXT NOT NULL,
        usuario_id TEXT NOT NULL,
        tipo TEXT NOT NULL,
        concepto TEXT NOT NULL,
        monto REAL NOT NULL,
        referencia TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (caja_id) REFERENCES caja(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
      );`,
      `CREATE TABLE IF NOT EXISTS cortes_caja (
        id TEXT PRIMARY KEY,
        caja_id TEXT NOT NULL UNIQUE,
        usuario_id TEXT NOT NULL,
        total_ingresos REAL NOT NULL DEFAULT 0,
        total_egresos REAL NOT NULL DEFAULT 0,
        total_retiros REAL NOT NULL DEFAULT 0,
        total_devoluciones REAL NOT NULL DEFAULT 0,
        total_ventas REAL NOT NULL DEFAULT 0,
        arqueo REAL NOT NULL DEFAULT 0,
        diferencia REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (caja_id) REFERENCES caja(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
      );`,
      `CREATE TABLE IF NOT EXISTS configuracion (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL UNIQUE,
        moneda TEXT NOT NULL DEFAULT 'MXN',
        iva_porcentaje REAL NOT NULL DEFAULT 16,
        timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
        tema TEXT NOT NULL DEFAULT 'light',
        auto_sync_drive INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON UPDATE CASCADE ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS bitacora (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        usuario_id TEXT,
        entidad TEXT NOT NULL,
        entidad_id TEXT,
        accion TEXT NOT NULL,
        detalle TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL
      );`,
      `CREATE TABLE IF NOT EXISTS backups (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        archivo_nombre TEXT NOT NULL,
        drive_file_id TEXT,
        local_sha256 TEXT NOT NULL,
        remote_modified_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON UPDATE CASCADE ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS sincronizacion (
        id TEXT PRIMARY KEY,
        empresa_id TEXT NOT NULL,
        origen TEXT NOT NULL,
        estado TEXT NOT NULL,
        local_modified_at TEXT NOT NULL,
        remote_modified_at TEXT,
        last_synced_at TEXT NOT NULL,
        conflict_resolution TEXT NOT NULL,
        detalle TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON UPDATE CASCADE ON DELETE CASCADE
      );`,
      'CREATE INDEX IF NOT EXISTS idx_roles_slug ON roles(slug);',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_role ON usuarios(empresa_id, role_id);',
      'CREATE INDEX IF NOT EXISTS idx_categorias_empresa_nombre ON categorias(empresa_id, nombre);',
      'CREATE INDEX IF NOT EXISTS idx_productos_empresa_categoria ON productos(empresa_id, categoria_id);',
      'CREATE INDEX IF NOT EXISTS idx_productos_empresa_activo ON productos(empresa_id, activo);',
      'CREATE INDEX IF NOT EXISTS idx_extras_empresa_activo ON extras(empresa_id, activo);',
      'CREATE INDEX IF NOT EXISTS idx_clientes_empresa_nombre ON clientes(empresa_id, nombre);',
      'CREATE INDEX IF NOT EXISTS idx_ventas_empresa_fecha ON ventas(empresa_id, fecha);',
      'CREATE INDEX IF NOT EXISTS idx_detalle_venta_venta ON detalle_venta(venta_id);',
      'CREATE INDEX IF NOT EXISTS idx_inventario_empresa_producto ON inventario(empresa_id, producto_id);',
      'CREATE INDEX IF NOT EXISTS idx_movimientos_stock_empresa_fecha ON movimientos_stock(empresa_id, created_at);',
      'CREATE INDEX IF NOT EXISTS idx_caja_empresa_usuario_estado ON caja(empresa_id, usuario_id, estado);',
      'CREATE INDEX IF NOT EXISTS idx_movimientos_caja_caja_fecha ON movimientos_caja(caja_id, created_at);',
      'CREATE INDEX IF NOT EXISTS idx_bitacora_empresa_fecha ON bitacora(empresa_id, created_at);',
      'CREATE INDEX IF NOT EXISTS idx_backups_empresa_fecha ON backups(empresa_id, created_at);',
      'CREATE INDEX IF NOT EXISTS idx_sincronizacion_empresa_fecha ON sincronizacion(empresa_id, created_at);',
    ],
  },
]

const randomId = (prefix: string): string => {
  if (typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  const buffer = new Uint8Array(16)
  crypto.getRandomValues(buffer)
  return `${prefix}-${Array.from(buffer, (value) => value.toString(16).padStart(2, '0')).join('')}`
}

const nowIso = (): string => new Date().toISOString()

const toBlob = (bytes: Uint8Array): Blob => new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: SQLITE_FILE_MIME })

const isDatabaseReady = (value: unknown): value is SqlJsDatabase => Boolean(value) && typeof value === 'object'

const openStorage = async (): Promise<IDBDatabase> => {
  return await new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_STORE_NAME, 1)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(DATABASE_STORE)) {
        database.createObjectStore(DATABASE_STORE)
      }
    }

    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir IndexedDB'))
    request.onsuccess = () => resolve(request.result)
  })
}

const readPersistedDatabase = async (): Promise<PersistedDatabase | null> => {
  const storage = await openStorage()
  return await new Promise((resolve, reject) => {
    const transaction = storage.transaction(DATABASE_STORE, 'readonly')
    const store = transaction.objectStore(DATABASE_STORE)
    const request = store.get(DATABASE_KEY)

    request.onerror = () => reject(request.error ?? new Error('No se pudo leer la base local'))
    request.onsuccess = () => {
      const record = request.result as PersistedDatabase | undefined
      resolve(record ?? null)
    }
  })
}

const writePersistedDatabase = async (record: PersistedDatabase): Promise<void> => {
  const storage = await openStorage()
  await new Promise<void>((resolve, reject) => {
    const transaction = storage.transaction(DATABASE_STORE, 'readwrite')
    const store = transaction.objectStore(DATABASE_STORE)
    const request = store.put(record, DATABASE_KEY)

    request.onerror = () => reject(request.error ?? new Error('No se pudo guardar la base local'))
    request.onsuccess = () => resolve()
  })
}

const mapUser = (row: Record<string, unknown>): InternalUser => ({
  id: String(row.id),
  email: String(row.usuario),
  name: String(row.nombre),
  role: row.role_slug === 'seller' ? 'seller' : 'admin',
  createdAt: String(row.created_at),
  mustChangePassword: Number(row.must_change_password) === 1,
})

export const createDatabaseService = (): DatabaseService => {
  let db: SqlJsDatabase | null = null
  let sqlJsPromise: Promise<SqlJsStatic> | null = null
  let initialized = false
  let loadingPromise: Promise<void> | null = null
  let snapshot: LocalSnapshot = {
    lastSavedAt: null,
    checksum: null,
  }

  const loadSqlJs = async (): Promise<SqlJsStatic> => {
    if (!sqlJsPromise) {
      sqlJsPromise = initSqlJs({ locateFile: () => sqlWasmUrl })
    }

    return await sqlJsPromise
  }

  const ensureDatabase = async (): Promise<SqlJsDatabase> => {
    if (!initialized) {
      await initialize()
    }

    if (!isDatabaseReady(db)) {
      throw new Error('La base de datos no está lista.')
    }

    return db
  }

  const exec = (database: SqlJsDatabase, statement: string, params: ReadonlyArray<string | number | null> = []): void => {
    const prepared = database.prepare(statement)

    try {
      prepared.bind(params)
      prepared.step()
    } finally {
      prepared.free()
    }
  }

  const getRow = <T extends Record<string, unknown>>(database: SqlJsDatabase, statement: string, params: ReadonlyArray<string | number | null> = []): T | null => {
    const prepared = database.prepare(statement)

    try {
      prepared.bind(params)
      if (!prepared.step()) {
        return null
      }

      return prepared.getAsObject() as T
    } finally {
      prepared.free()
    }
  }

  const runStatements = (database: SqlJsDatabase, statements: string[]): void => {
    for (const statement of statements) {
      database.run(statement)
    }
  }

  const getUserVersion = (database: SqlJsDatabase): number => {
    const row = getRow<{ user_version: number }>(database, 'PRAGMA user_version;')
    return row ? Number(row.user_version) : 0
  }

  const setUserVersion = (database: SqlJsDatabase, version: number): void => {
    database.run(`PRAGMA user_version = ${version};`)
  }

  const applyMigrations = (database: SqlJsDatabase): void => {
    const currentVersion = getUserVersion(database)

    for (const migration of MIGRATION_STATEMENTS) {
      if (migration.version > currentVersion) {
        runStatements(database, migration.statements)
        setUserVersion(database, migration.version)
      }
    }
  }

  const ensureSeedData = async (database: SqlJsDatabase): Promise<void> => {
    const companyCount = getRow<{ total: number }>(database, 'SELECT COUNT(*) AS total FROM empresa;')

    const normalizedAt = nowIso()
    const seedPasswords = await Promise.all([
      hashPassword('admin123'),
      hashPassword('vendedor123'),
    ])

    exec(
      database,
      `UPDATE usuarios
       SET password_hash = CASE id
         WHEN ? THEN ?
         WHEN ? THEN ?
         ELSE password_hash
       END,
       password_salt = CASE id
         WHEN ? THEN ?
         WHEN ? THEN ?
         ELSE password_salt
       END,
       password_iterations = CASE id
         WHEN ? THEN ?
         WHEN ? THEN ?
         ELSE password_iterations
       END,
       must_change_password = 0,
       updated_at = ?
       WHERE id IN (?, ?);`,
      [
        DEFAULT_ADMIN_ID,
        seedPasswords[0].hash,
        DEFAULT_SELLER_ID,
        seedPasswords[1].hash,
        DEFAULT_ADMIN_ID,
        seedPasswords[0].salt,
        DEFAULT_SELLER_ID,
        seedPasswords[1].salt,
        DEFAULT_ADMIN_ID,
        310000,
        DEFAULT_SELLER_ID,
        310000,
        normalizedAt,
        DEFAULT_ADMIN_ID,
        DEFAULT_SELLER_ID,
      ],
    )

    if (companyCount && Number(companyCount.total) > 0) {
      return
    }

    const createdAt = nowIso()
    const adminPassword = await hashPassword('admin123')
    const sellerPassword = await hashPassword('vendedor123')

    database.run('BEGIN IMMEDIATE;')

    try {
      exec(database, 'INSERT INTO empresa (id, nombre, razon_social, activo, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?);', [ROOT_COMPANY_ID, 'NovaPOS', 'NovaPOS', createdAt, createdAt])
      exec(database, 'INSERT INTO roles (id, slug, nombre, descripcion, activo, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?);', [ROLE_ADMIN_ID, 'admin', 'Administrador', 'Acceso total al sistema', createdAt, createdAt])
      exec(database, 'INSERT INTO roles (id, slug, nombre, descripcion, activo, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?);', [ROLE_SELLER_ID, 'seller', 'Vendedor', 'Acceso operativo limitado', createdAt, createdAt])
      exec(database, 'INSERT INTO configuracion (id, empresa_id, moneda, iva_porcentaje, timezone, tema, auto_sync_drive, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?);', [randomId('config'), ROOT_COMPANY_ID, 'MXN', 16, 'America/Mexico_City', 'light', createdAt, createdAt])
      exec(database, 'INSERT INTO usuarios (id, empresa_id, role_id, usuario, nombre, email, password_hash, password_salt, password_iterations, must_change_password, activo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?);', [DEFAULT_ADMIN_ID, ROOT_COMPANY_ID, ROLE_ADMIN_ID, 'admin', 'Administrador', 'admin', adminPassword.hash, adminPassword.salt, 310000, createdAt, createdAt])
      exec(database, 'INSERT INTO usuarios (id, empresa_id, role_id, usuario, nombre, email, password_hash, password_salt, password_iterations, must_change_password, activo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?);', [DEFAULT_SELLER_ID, ROOT_COMPANY_ID, ROLE_SELLER_ID, 'vendedor', 'Vendedor', 'vendedor', sellerPassword.hash, sellerPassword.salt, 310000, createdAt, createdAt])
      exec(database, 'INSERT INTO sincronizacion (id, empresa_id, origen, estado, local_modified_at, remote_modified_at, last_synced_at, conflict_resolution, detalle, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);', [DATABASE_KEY, ROOT_COMPANY_ID, 'seed', 'sincronizado', createdAt, null, createdAt, 'seeded', 'Base creada desde cero', createdAt, createdAt])
      exec(database, 'INSERT INTO backups (id, empresa_id, archivo_nombre, drive_file_id, local_sha256, remote_modified_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [randomId('backup'), ROOT_COMPANY_ID, DATABASE_FILE_NAME, null, '', null, createdAt, createdAt])
      database.run('COMMIT;')
    } catch (error) {
      database.run('ROLLBACK;')
      throw error
    }
  }

  const persistDatabase = async (source: SyncStateInput['source'], remoteModifiedAt: string | null = null, conflictResolution: SyncStateInput['conflictResolution'] = 'none', detail = ''): Promise<void> => {
    const database = await ensureDatabase()
    const bytes = database.export()
    const blob = toBlob(bytes)
    const checksum = await sha256Hex(bytes)
    const lastSavedAt = nowIso()

    snapshot = { lastSavedAt, checksum }

    database.run('BEGIN IMMEDIATE;')

    try {
      exec(database, 'UPDATE sincronizacion SET origen = ?, estado = ?, local_modified_at = ?, remote_modified_at = ?, last_synced_at = ?, conflict_resolution = ?, detalle = ?, updated_at = ? WHERE id = ?;', [source, 'sincronizado', lastSavedAt, remoteModifiedAt, lastSavedAt, conflictResolution, detail || `Persistencia ${source}`, lastSavedAt, DATABASE_KEY])
      exec(database, 'INSERT OR REPLACE INTO backups (id, empresa_id, archivo_nombre, drive_file_id, local_sha256, remote_modified_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM backups WHERE id = ?), ?), ?);', [DATABASE_KEY, ROOT_COMPANY_ID, DATABASE_FILE_NAME, null, checksum, remoteModifiedAt, DATABASE_KEY, lastSavedAt, lastSavedAt])
      database.run('COMMIT;')
      await writePersistedDatabase({ blob, checksum, lastSavedAt })
    } catch (error) {
      database.run('ROLLBACK;')
      throw error
    }
  }

  const importDatabaseBlob = async (blob: Blob, source: SyncStateInput['source'], remoteModifiedAt: string | null = null, conflictResolution: SyncStateInput['conflictResolution'] = 'none', detail = ''): Promise<void> => {
    const sqlJs = await loadSqlJs()
    const bytes = new Uint8Array(await blob.arrayBuffer())

    if (db) {
      db.close()
    }

    db = new sqlJs.Database(bytes)
    db.run('PRAGMA foreign_keys = ON;')
    applyMigrations(db)
    await ensureSeedData(db)
    await persistDatabase(source, remoteModifiedAt, conflictResolution, detail)
    initialized = true
  }

  const initialize = async (): Promise<void> => {
    if (loadingPromise) {
      await loadingPromise
      return
    }

    loadingPromise = (async () => {
      const sqlJs = await loadSqlJs()
      const persisted = await readPersistedDatabase()

      if (persisted) {
        const bytes = new Uint8Array(await persisted.blob.arrayBuffer())
        db = new sqlJs.Database(bytes)
      } else {
        db = new sqlJs.Database()
      }

      db.run('PRAGMA foreign_keys = ON;')
      applyMigrations(db)
      await ensureSeedData(db)

      if (persisted) {
        snapshot = { lastSavedAt: persisted.lastSavedAt, checksum: persisted.checksum }
      }

      await persistDatabase(persisted ? 'local' : 'seed', null, persisted ? 'none' : 'seeded', persisted ? 'Base local cargada' : 'Base creada desde cero')
      initialized = true
    })()

    await loadingPromise
  }

  const getLocalSnapshot = async (): Promise<LocalSnapshot> => {
    await ensureDatabase()
    return snapshot
  }

  const hasLocalDatabase = async (): Promise<boolean> => {
    const persisted = await readPersistedDatabase()
    return persisted !== null
  }

  const exportDatabase = async (): Promise<Blob> => {
    const database = await ensureDatabase()
    return toBlob(database.export())
  }

  const importDatabase = async (blob: Blob): Promise<void> => {
    await importDatabaseBlob(blob, 'drive', null, 'remote-wins', 'Base importada desde Google Drive')
  }

  const findInternalUserByEmail = async (email: string): Promise<InternalUser | null> => {
    const database = await ensureDatabase()
    const row = getRow<Record<string, unknown>>(
      database,
      `SELECT
         u.id,
         u.usuario,
         u.nombre,
         u.created_at,
         u.must_change_password,
         r.slug AS role_slug
       FROM usuarios u
       INNER JOIN roles r ON r.id = u.role_id
       WHERE (LOWER(u.usuario) = LOWER(?) OR LOWER(COALESCE(u.email, '')) = LOWER(?))
         AND u.activo = 1
       LIMIT 1;`,
      [email, email],
    )

    return row ? mapUser(row) : null
  }

  const authenticateInternalUser = async (email: string, password: string): Promise<InternalUser> => {
    const database = await ensureDatabase()
    const row = getRow<Record<string, unknown>>(
      database,
      `SELECT
         u.id,
         u.usuario,
         u.nombre,
         u.password_hash,
         u.password_salt,
         u.must_change_password,
         u.created_at,
         r.slug AS role_slug
       FROM usuarios u
       INNER JOIN roles r ON r.id = u.role_id
       WHERE (LOWER(u.usuario) = LOWER(?) OR LOWER(COALESCE(u.email, '')) = LOWER(?))
         AND u.activo = 1
       LIMIT 1;`,
      [email, email],
    )

    if (!row) {
      throw new Error('Usuario no encontrado')
    }

    const isValid = await verifyPassword(password, String(row.password_salt), String(row.password_hash))

    if (!isValid) {
      throw new Error('Contraseña incorrecta')
    }

    const loginTime = nowIso()
    database.run('BEGIN IMMEDIATE;')

    try {
      exec(database, 'UPDATE usuarios SET last_login_at = ?, updated_at = ? WHERE id = ?;', [loginTime, loginTime, String(row.id)])
      exec(database, 'INSERT INTO bitacora (id, empresa_id, usuario_id, entidad, entidad_id, accion, detalle, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [randomId('log'), ROOT_COMPANY_ID, String(row.id), 'usuarios', String(row.id), 'login', 'Inicio de sesión interno exitoso', loginTime])
      database.run('COMMIT;')
    } catch (error) {
      database.run('ROLLBACK;')
      throw error
    }

    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Login interno exitoso')
    return mapUser(row)
  }

  const saveInternalUser = async (user: InternalUser, password: string): Promise<void> => {
    const database = await ensureDatabase()
    const passwordData = await hashPassword(password)
    const timestamp = nowIso()
    const role = getRow<{ id: string }>(database, 'SELECT id FROM roles WHERE slug = ? LIMIT 1;', [user.role])

    if (!role) {
      throw new Error('Rol no encontrado')
    }

    database.run('BEGIN IMMEDIATE;')

    try {
      exec(
        database,
        `INSERT OR REPLACE INTO usuarios (
          id, empresa_id, role_id, usuario, nombre, email, password_hash, password_salt,
          password_iterations, must_change_password, activo, created_at, updated_at, last_login_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, COALESCE((SELECT created_at FROM usuarios WHERE id = ?), ?), ?, NULL);`,
        [user.id, ROOT_COMPANY_ID, role.id, user.email, user.name, user.email, passwordData.hash, passwordData.salt, 310000, user.mustChangePassword ? 1 : 0, user.id, user.createdAt, timestamp],
      )
      database.run('COMMIT;')
    } catch (error) {
      database.run('ROLLBACK;')
      throw error
    }

    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Usuario guardado')
  }

  const changeUserPassword = async (userId: string, password: string, mustChangePassword = false): Promise<void> => {
    const database = await ensureDatabase()
    const passwordData = await hashPassword(password)
    const timestamp = nowIso()

    database.run('BEGIN IMMEDIATE;')

    try {
      exec(
        database,
        'UPDATE usuarios SET password_hash = ?, password_salt = ?, password_iterations = ?, must_change_password = ?, updated_at = ? WHERE id = ?;',
        [passwordData.hash, passwordData.salt, 310000, mustChangePassword ? 1 : 0, timestamp, userId],
      )
      exec(database, 'INSERT INTO bitacora (id, empresa_id, usuario_id, entidad, entidad_id, accion, detalle, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [randomId('log'), ROOT_COMPANY_ID, userId, 'usuarios', userId, 'change_password', 'Cambio de contraseña', timestamp])
      database.run('COMMIT;')
    } catch (error) {
      database.run('ROLLBACK;')
      throw error
    }

    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Contraseña actualizada')
  }

  const setUserMustChangePassword = async (userId: string, mustChangePassword: boolean): Promise<void> => {
    const database = await ensureDatabase()
    const timestamp = nowIso()
    exec(database, 'UPDATE usuarios SET must_change_password = ?, updated_at = ? WHERE id = ?;', [mustChangePassword ? 1 : 0, timestamp, userId])
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Estado de cambio de contraseña actualizado')
  }

  const updateSyncState = async (input: SyncStateInput): Promise<void> => {
    const database = await ensureDatabase()
    const timestamp = nowIso()
    exec(
      database,
      `INSERT OR REPLACE INTO sincronizacion (
        id, empresa_id, origen, estado, local_modified_at, remote_modified_at, last_synced_at, conflict_resolution, detalle, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM sincronizacion WHERE id = ?), ?), ?);`,
      [DATABASE_KEY, ROOT_COMPANY_ID, input.source, 'sincronizado', input.localModifiedAt, input.remoteModifiedAt, input.localModifiedAt, input.conflictResolution, input.detail, DATABASE_KEY, timestamp, timestamp],
    )
    snapshot = { lastSavedAt: input.localModifiedAt, checksum: snapshot.checksum }
    await persistDatabase(input.source, input.remoteModifiedAt, input.conflictResolution, input.detail)
  }

  const transaction = async <T>(action: (database: SqlJsDatabase) => Promise<T> | T): Promise<T> => {
    const database = await ensureDatabase()
    database.run('BEGIN IMMEDIATE;')

    try {
      const result = await action(database)
      database.run('COMMIT;')
      await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Transacción aplicada')
      return result
    } catch (error) {
      database.run('ROLLBACK;')
      throw error
    }
  }

  return {
    initialize,
    hasLocalDatabase,
    importDatabase,
    exportDatabase,
    getLocalSnapshot,
    findInternalUserByEmail,
    authenticateInternalUser,
    saveInternalUser,
    changeUserPassword,
    setUserMustChangePassword,
    updateSyncState,
    transaction,
  }
}

export const DatabaseServiceImpl = createDatabaseService()

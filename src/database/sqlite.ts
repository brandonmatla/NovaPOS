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

export interface ProductCategory {
  id: string
  name: string
  slug: string
  description: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  categoryId: string | null
  categoryName: string | null
  categorySlug: string | null
  name: string
  description: string | null
  code: string
  barcode: string | null
  imageUrl: string | null
  purchasePrice: number
  salePrice: number
  stock: number
  stockMin: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductFilters {
  query?: string
  categoryId?: string | null
  active?: boolean
  lowStock?: boolean
  hasBarcode?: boolean
  minPurchasePrice?: number
  maxPurchasePrice?: number
  minSalePrice?: number
  maxSalePrice?: number
  limit?: number
  offset?: number
  sortBy?: 'name' | 'code' | 'salePrice' | 'purchasePrice' | 'stock' | 'updatedAt'
  sortDirection?: 'asc' | 'desc'
}

export interface ProductCategoryInput {
  id: string
  name: string
  description?: string | null
  active?: boolean
  slug?: string
}

export interface ProductInput {
  id: string
  categoryId?: string | null
  name: string
  description?: string | null
  code: string
  barcode?: string | null
  imageUrl?: string | null
  purchasePrice?: number
  salePrice?: number
  stock?: number
  stockMin?: number
  active?: boolean
}

export interface Extra {
  id: string
  name: string
  description: string | null
  price: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ExtraInput {
  id: string
  name: string
  description?: string | null
  price?: number
  active?: boolean
}

export type CashRegisterStatus = 'abierta' | 'cerrada'
export type CashMovementType = 'ingreso' | 'egreso' | 'retiro' | 'devolucion'

export interface CashRegister {
  id: string
  userId: string
  status: CashRegisterStatus
  openingAt: string
  closingAt: string | null
  openingAmount: number
  closingAmount: number | null
  difference: number | null
  observations: string | null
  createdAt: string
  updatedAt: string
}

export interface CashMovement {
  id: string
  cashRegisterId: string
  userId: string
  type: CashMovementType
  concept: string
  amount: number
  reference: string | null
  createdAt: string
}

export interface CashCut {
  id: string
  cashRegisterId: string
  userId: string
  totalIncome: number
  totalExpense: number
  totalWithdrawals: number
  totalReturns: number
  totalSales: number
  cashCount: number
  difference: number
  createdAt: string
}

export interface CashRegisterInput {
  id: string
  userId: string
  openingAmount?: number
  observations?: string | null
}

export interface CashMovementInput {
  id: string
  cashRegisterId: string
  userId: string
  type: CashMovementType
  concept: string
  amount: number
  reference?: string | null
}

export interface CashCutInput {
  id: string
  cashRegisterId: string
  userId: string
  cashCount: number
  observations?: string | null
}

export type SaleStatus = 'abierta' | 'cancelada'

export interface SalePaymentInput {
  id: string
  method: string
  amount: number
  reference?: string | null
}

export interface SaleDetailExtraInput {
  extraId: string
}

export interface SaleDetailInput {
  id: string
  productId: string
  quantity: number
  unitPrice?: number
  extras?: SaleDetailExtraInput[]
}

export interface SaleInput {
  id: string
  userId: string
  customerId?: string | null
  number?: string | null
  notes?: string | null
  discount?: number
  paymentMethod?: string | null
  payments?: SalePaymentInput[]
  details: SaleDetailInput[]
}

export interface SaleDetailExtra {
  extraId: string
  extraName: string
  price: number
}

export interface SaleDetail {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
  extras: SaleDetailExtra[]
  createdAt: string
}

export interface SalePayment {
  id: string
  method: string
  amount: number
  reference: string | null
  createdAt: string
}

export interface Sale {
  id: string
  number: string
  userId: string
  userName: string | null
  customerId: string | null
  customerName: string | null
  status: SaleStatus
  date: string
  subtotal: number
  ivaRate: number
  iva: number
  discount: number
  total: number
  paymentMethod: string
  notes: string | null
  cancelReason: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
  details: SaleDetail[]
  payments: SalePayment[]
}

export interface SaleFilters {
  query?: string
  status?: SaleStatus
  userId?: string
  customerId?: string
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
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
  listCategories(includeInactive?: boolean): Promise<ProductCategory[]>
  findCategoryById(id: string): Promise<ProductCategory | null>
  saveCategory(category: ProductCategoryInput): Promise<void>
  deleteCategory(id: string): Promise<void>
  listProducts(filters?: ProductFilters): Promise<Product[]>
  searchProducts(query: string, filters?: Omit<ProductFilters, 'query'>): Promise<Product[]>
  findProductById(id: string): Promise<Product | null>
  findProductByBarcode(barcode: string): Promise<Product | null>
  saveProduct(product: ProductInput): Promise<void>
  deleteProduct(id: string): Promise<void>
  updateProductStock(id: string, stock: number): Promise<void>
  listExtras(includeInactive?: boolean): Promise<Extra[]>
  findExtraById(id: string): Promise<Extra | null>
  saveExtra(extra: ExtraInput): Promise<void>
  deleteExtra(id: string): Promise<void>
  listExtrasByProduct(productId: string): Promise<Extra[]>
  setProductExtras(productId: string, extraIds: string[]): Promise<void>
  findOpenCashRegisterByUser(userId: string): Promise<CashRegister | null>
  openCashRegister(input: CashRegisterInput): Promise<CashRegister>
  closeCashRegister(cashRegisterId: string, closingAmount: number, observations?: string | null): Promise<CashRegister>
  registerCashMovement(input: CashMovementInput): Promise<CashMovement>
  registerCashCut(input: CashCutInput): Promise<CashCut>
  listCashRegisters(filters?: { userId?: string; status?: CashRegisterStatus; limit?: number; offset?: number }): Promise<CashRegister[]>
  listCashMovements(filters?: { cashRegisterId?: string; userId?: string; type?: CashMovementType; limit?: number; offset?: number }): Promise<CashMovement[]>
  listCashCuts(filters?: { cashRegisterId?: string; userId?: string; limit?: number; offset?: number }): Promise<CashCut[]>
  createSale(input: SaleInput): Promise<Sale>
  updateSale(id: string, input: SaleInput): Promise<Sale>
  cancelSale(id: string, reason?: string | null): Promise<Sale>
  findSaleById(id: string): Promise<Sale | null>
  listSales(filters?: SaleFilters): Promise<Sale[]>
  listSaleDetails(saleId: string): Promise<SaleDetail[]>
  listSalePayments(saleId: string): Promise<SalePayment[]>
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
  {
    version: 2,
    statements: [
      'CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_activo ON usuarios(empresa_id, activo);',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_role_id ON usuarios(role_id);',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_usuario_nocase ON usuarios(usuario COLLATE NOCASE);',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_email_nocase ON usuarios(email COLLATE NOCASE);',
      'CREATE INDEX IF NOT EXISTS idx_categorias_empresa_slug ON categorias(empresa_id, slug);',
      'CREATE INDEX IF NOT EXISTS idx_productos_empresa_codigo_barras ON productos(empresa_id, codigo_barras);',
      'CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON productos(categoria_id);',
      'CREATE INDEX IF NOT EXISTS idx_extras_empresa_nombre ON extras(empresa_id, nombre);',
      'CREATE INDEX IF NOT EXISTS idx_producto_extra_producto ON producto_extra(producto_id);',
      'CREATE INDEX IF NOT EXISTS idx_producto_extra_extra ON producto_extra(extra_id);',
      'CREATE INDEX IF NOT EXISTS idx_clientes_empresa_documento ON clientes(empresa_id, documento);',
      'CREATE INDEX IF NOT EXISTS idx_ventas_empresa_cliente ON ventas(empresa_id, cliente_id);',
      'CREATE INDEX IF NOT EXISTS idx_ventas_empresa_estado_fecha ON ventas(empresa_id, estado, fecha);',
      'CREATE INDEX IF NOT EXISTS idx_detalle_venta_producto ON detalle_venta(producto_id);',
      'CREATE INDEX IF NOT EXISTS idx_detalle_extra_detalle ON detalle_extra(detalle_venta_id);',
      'CREATE INDEX IF NOT EXISTS idx_detalle_extra_extra ON detalle_extra(extra_id);',
      'CREATE INDEX IF NOT EXISTS idx_inventario_producto ON inventario(producto_id);',
      'CREATE INDEX IF NOT EXISTS idx_movimientos_stock_producto ON movimientos_stock(producto_id);',
      'CREATE INDEX IF NOT EXISTS idx_movimientos_stock_usuario ON movimientos_stock(usuario_id);',
      'CREATE INDEX IF NOT EXISTS idx_caja_usuario_estado ON caja(usuario_id, estado);',
      'CREATE INDEX IF NOT EXISTS idx_movimientos_caja_usuario ON movimientos_caja(usuario_id);',
      'CREATE INDEX IF NOT EXISTS idx_cortes_caja_usuario ON cortes_caja(usuario_id);',
      'CREATE INDEX IF NOT EXISTS idx_backups_drive_file_id ON backups(drive_file_id);',
      'CREATE INDEX IF NOT EXISTS idx_sincronizacion_estado ON sincronizacion(estado);',
    ],
  },
  {
    version: 3,
    statements: [
      'CREATE INDEX IF NOT EXISTS idx_categorias_empresa_activo_nombre ON categorias(empresa_id, activo, nombre);',
      'CREATE INDEX IF NOT EXISTS idx_categorias_empresa_nombre_nocase ON categorias(empresa_id, nombre COLLATE NOCASE);',
      'CREATE INDEX IF NOT EXISTS idx_productos_empresa_nombre_nocase ON productos(empresa_id, nombre COLLATE NOCASE);',
      'CREATE INDEX IF NOT EXISTS idx_productos_empresa_codigo_nocase ON productos(empresa_id, codigo COLLATE NOCASE);',
      'CREATE INDEX IF NOT EXISTS idx_productos_empresa_activo_categoria ON productos(empresa_id, activo, categoria_id);',
      'CREATE INDEX IF NOT EXISTS idx_productos_empresa_stock ON productos(empresa_id, stock, stock_minimo);',
      'CREATE INDEX IF NOT EXISTS idx_productos_empresa_updated_at ON productos(empresa_id, updated_at);',
    ],
  },
  {
    version: 4,
    statements: [
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_caja_unica_abierta_por_usuario ON caja(usuario_id) WHERE estado = 'abierta';",
      'CREATE INDEX IF NOT EXISTS idx_caja_empresa_estado_fecha ON caja(empresa_id, estado, apertura_at);',
      'CREATE INDEX IF NOT EXISTS idx_caja_usuario_apertura ON caja(usuario_id, apertura_at);',
      'CREATE INDEX IF NOT EXISTS idx_movimientos_caja_tipo_fecha ON movimientos_caja(caja_id, tipo, created_at);',
      'CREATE INDEX IF NOT EXISTS idx_movimientos_caja_tipo ON movimientos_caja(tipo);',
      'CREATE INDEX IF NOT EXISTS idx_cortes_caja_fecha ON cortes_caja(caja_id, created_at);',
    ],
  },
  {
    version: 5,
    statements: [
      'ALTER TABLE ventas ADD COLUMN cancelado_at TEXT;',
      'ALTER TABLE ventas ADD COLUMN motivo_cancelacion TEXT;',
      `CREATE TABLE IF NOT EXISTS venta_pagos (
        id TEXT PRIMARY KEY,
        venta_id TEXT NOT NULL,
        metodo_pago TEXT NOT NULL,
        monto REAL NOT NULL,
        referencia TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (venta_id) REFERENCES ventas(id) ON UPDATE CASCADE ON DELETE CASCADE
      );`,
      'CREATE INDEX IF NOT EXISTS idx_venta_pagos_venta ON venta_pagos(venta_id);',
      'CREATE INDEX IF NOT EXISTS idx_venta_pagos_metodo ON venta_pagos(metodo_pago);',
      'CREATE INDEX IF NOT EXISTS idx_ventas_cancelado_at ON ventas(cancelado_at);',
      'CREATE INDEX IF NOT EXISTS idx_ventas_numero ON ventas(numero);',
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

const writePersistedDatabase = async (
    record: PersistedDatabase
): Promise<void> => {

    const storage = await openStorage()

    await new Promise<void>((resolve, reject) => {

        const tx = storage.transaction(DATABASE_STORE, "readwrite")

        tx.oncomplete = () => resolve()

        tx.onerror = () =>
            reject(tx.error ?? new Error("IndexedDB transaction error"))

        tx.onabort = () =>
            reject(tx.error ?? new Error("IndexedDB transaction aborted"))

        tx.objectStore(DATABASE_STORE).put(record, DATABASE_KEY)
    })

    storage.close()
}

const mapUser = (row: Record<string, unknown>): InternalUser => ({
  id: String(row.id),
  email: String(row.usuario),
  name: String(row.nombre),
  role: row.role_slug === 'seller' ? 'seller' : 'admin',
  createdAt: String(row.created_at),
  mustChangePassword: Number(row.must_change_password) === 1,
})

const mapCategory = (row: Record<string, unknown>): ProductCategory => ({
  id: String(row.id),
  name: String(row.name),
  slug: String(row.slug),
  description: row.description == null ? null : String(row.description),
  active: Number(row.active) === 1,
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
})

const mapProduct = (row: Record<string, unknown>): Product => ({
  id: String(row.id),
  categoryId: row.category_id == null ? null : String(row.category_id),
  categoryName: row.category_name == null ? null : String(row.category_name),
  categorySlug: row.category_slug == null ? null : String(row.category_slug),
  name: String(row.name),
  description: row.description == null ? null : String(row.description),
  code: String(row.code),
  barcode: row.barcode == null ? null : String(row.barcode),
  imageUrl: row.image_url == null ? null : String(row.image_url),
  purchasePrice: Number(row.purchase_price),
  salePrice: Number(row.sale_price),
  stock: Number(row.stock),
  stockMin: Number(row.stock_minimo),
  active: Number(row.active) === 1,
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
})

const mapExtra = (row: Record<string, unknown>): Extra => ({
  id: String(row.id),
  name: String(row.name),
  description: row.description == null ? null : String(row.description),
  price: Number(row.price),
  active: Number(row.active) === 1,
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
})

const mapCashRegister = (row: Record<string, unknown>): CashRegister => ({
  id: String(row.id),
  userId: String(row.user_id),
  status: String(row.estado) === 'cerrada' ? 'cerrada' : 'abierta',
  openingAt: String(row.apertura_at),
  closingAt: row.cierre_at == null ? null : String(row.cierre_at),
  openingAmount: Number(row.saldo_inicial),
  closingAmount: row.saldo_final == null ? null : Number(row.saldo_final),
  difference: row.diferencia == null ? null : Number(row.diferencia),
  observations: row.observaciones == null ? null : String(row.observaciones),
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
})

const mapCashMovement = (row: Record<string, unknown>): CashMovement => ({
  id: String(row.id),
  cashRegisterId: String(row.caja_id),
  userId: String(row.usuario_id),
  type: String(row.tipo) as CashMovementType,
  concept: String(row.concepto),
  amount: Number(row.monto),
  reference: row.referencia == null ? null : String(row.referencia),
  createdAt: String(row.created_at),
})

const mapCashCut = (row: Record<string, unknown>): CashCut => ({
  id: String(row.id),
  cashRegisterId: String(row.caja_id),
  userId: String(row.usuario_id),
  totalIncome: Number(row.total_ingresos),
  totalExpense: Number(row.total_egresos),
  totalWithdrawals: Number(row.total_retiros),
  totalReturns: Number(row.total_devoluciones),
  totalSales: Number(row.total_ventas),
  cashCount: Number(row.arqueo),
  difference: Number(row.diferencia),
  createdAt: String(row.created_at),
})

const mapSaleDetailExtra = (row: Record<string, unknown>): SaleDetailExtra => ({
  extraId: String(row.extra_id),
  extraName: String(row.extra_name),
  price: Number(row.price),
})

const mapSaleDetail = (row: Record<string, unknown>): SaleDetail => ({
  id: String(row.id),
  productId: String(row.product_id),
  productName: String(row.product_name),
  quantity: Number(row.cantidad),
  unitPrice: Number(row.precio_unitario),
  subtotal: Number(row.subtotal),
  extras: Array.isArray(row.extras) ? (row.extras as Record<string, unknown>[]).map(mapSaleDetailExtra) : [],
  createdAt: String(row.created_at),
})

const mapSalePayment = (row: Record<string, unknown>): SalePayment => ({
  id: String(row.id),
  method: String(row.metodo_pago),
  amount: Number(row.monto),
  reference: row.referencia == null ? null : String(row.referencia),
  createdAt: String(row.created_at),
})

const mapSaleHeader = (row: Record<string, unknown>): Omit<Sale, 'details' | 'payments'> => ({
  id: String(row.id),
  number: String(row.numero),
  userId: String(row.user_id),
  userName: row.user_name == null ? null : String(row.user_name),
  customerId: row.customer_id == null ? null : String(row.customer_id),
  customerName: row.customer_name == null ? null : String(row.customer_name),
  status: String(row.estado) === 'cancelada' ? 'cancelada' : 'abierta',
  date: String(row.fecha),
  subtotal: Number(row.subtotal),
  ivaRate: Number(row.iva_porcentaje ?? 16),
  iva: Number(row.iva),
  discount: Number(row.descuento),
  total: Number(row.total),
  paymentMethod: String(row.metodo_pago),
  notes: row.notas == null ? null : String(row.notas),
  cancelReason: row.motivo_cancelacion == null ? null : String(row.motivo_cancelacion),
  cancelledAt: row.cancelado_at == null ? null : String(row.cancelado_at),
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
})

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100

const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const applyDatabasePragmas = (database: SqlJsDatabase): void => {
  database.run('PRAGMA foreign_keys = ON;')
  database.run('PRAGMA temp_store = MEMORY;')
  database.run('PRAGMA synchronous = NORMAL;')
  database.run('PRAGMA cache_size = -20000;')
}

export const createDatabaseService = (): DatabaseService => {
  let db: SqlJsDatabase | null = null
  let sqlJsPromise: Promise<SqlJsStatic> | null = null
  let initialized = false
  let loadingPromise: Promise<void> | null = null
  let transactionDepth = 0
  let snapshot: LocalSnapshot = {
    lastSavedAt: null,
    checksum: null,
  }

  const withTimeout = async <T,>(task: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    try {
      return await Promise.race([
        task,
        new Promise<T>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error(`${label} tardó más de ${Math.round(timeoutMs / 1000)} segundos`)), timeoutMs)
        }),
      ])
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }

  const loadSqlJs = async (): Promise<SqlJsStatic> => {
    if (!sqlJsPromise) {
      console.log('SQLite Paso 1: initSqlJs:start')
      sqlJsPromise = initSqlJs({ locateFile: () => sqlWasmUrl })
    }

    const sqlJs = await withTimeout(sqlJsPromise, 10_000, 'Carga de sql.js / sql-wasm.wasm')
    console.log('SQLite Paso 2: initSqlJs:done')
    return sqlJs
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

  const getRows = <T extends Record<string, unknown>>(database: SqlJsDatabase, statement: string, params: ReadonlyArray<string | number | null> = []): T[] => {
    const prepared = database.prepare(statement)
    const rows: T[] = []

    try {
      prepared.bind(params)

      while (prepared.step()) {
        rows.push(prepared.getAsObject() as T)
      }

      return rows
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

  const withTransaction = async <T>(database: SqlJsDatabase, action: () => Promise<T> | T): Promise<T> => {
    const isOuterTransaction = transactionDepth === 0

    if (isOuterTransaction) {
      database.run('BEGIN IMMEDIATE;')
    }

    transactionDepth += 1

    try {
      const result = await action()

      if (isOuterTransaction) {
        database.run('COMMIT;')
      }

      return result
    } catch (error) {
      if (isOuterTransaction) {
        database.run('ROLLBACK;')
      }

      throw error
    } finally {
      transactionDepth -= 1
    }
  }

  const userRepository = {
    findByEmail(database: SqlJsDatabase, email: string): InternalUser | null {
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
    },

    getAuthenticationRow(database: SqlJsDatabase, email: string): Record<string, unknown> | null {
      return getRow<Record<string, unknown>>(
        database,
        `SELECT
           u.id,
           u.usuario,
           u.nombre,
           u.password_hash,
           u.password_salt,
           u.must_change_password,
           u.last_login_at,
           u.created_at,
           r.slug AS role_slug
         FROM usuarios u
         INNER JOIN roles r ON r.id = u.role_id
         WHERE (LOWER(u.usuario) = LOWER(?) OR LOWER(COALESCE(u.email, '')) = LOWER(?))
           AND u.activo = 1
         LIMIT 1;`,
        [email, email],
      )
    },

    async recordLogin(database: SqlJsDatabase, userId: string): Promise<void> {
      const loginTime = nowIso()
      await withTransaction(database, () => {
        exec(database, 'UPDATE usuarios SET last_login_at = ?, updated_at = ? WHERE id = ?;', [loginTime, loginTime, userId])
        exec(database, 'INSERT INTO bitacora (id, empresa_id, usuario_id, entidad, entidad_id, accion, detalle, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [randomId('log'), ROOT_COMPANY_ID, userId, 'usuarios', userId, 'login', 'Inicio de sesión interno exitoso', loginTime])
      })
    },

    async save(database: SqlJsDatabase, user: InternalUser, passwordData: { hash: string; salt: string }): Promise<void> {
      const timestamp = nowIso()
      const role = getRow<{ id: string }>(database, 'SELECT id FROM roles WHERE slug = ? LIMIT 1;', [user.role])

      if (!role) {
        throw new Error('Rol no encontrado')
      }

      await withTransaction(database, () => {
        exec(
          database,
          `INSERT OR REPLACE INTO usuarios (
            id, empresa_id, role_id, usuario, nombre, email, password_hash, password_salt,
            password_iterations, must_change_password, activo, created_at, updated_at, last_login_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, COALESCE((SELECT created_at FROM usuarios WHERE id = ?), ?), ?, NULL);`,
          [user.id, ROOT_COMPANY_ID, role.id, user.email, user.name, user.email, passwordData.hash, passwordData.salt, 310000, user.mustChangePassword ? 1 : 0, user.id, user.createdAt, timestamp],
        )
      })
    },

    async changePassword(database: SqlJsDatabase, userId: string, passwordData: { hash: string; salt: string }, mustChangePassword: boolean): Promise<void> {
      const timestamp = nowIso()

      await withTransaction(database, () => {
        exec(
          database,
          'UPDATE usuarios SET password_hash = ?, password_salt = ?, password_iterations = ?, must_change_password = ?, updated_at = ? WHERE id = ?;',
          [passwordData.hash, passwordData.salt, 310000, mustChangePassword ? 1 : 0, timestamp, userId],
        )
        exec(database, 'INSERT INTO bitacora (id, empresa_id, usuario_id, entidad, entidad_id, accion, detalle, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [randomId('log'), ROOT_COMPANY_ID, userId, 'usuarios', userId, 'change_password', 'Cambio de contraseña', timestamp])
      })
    },

    async updateMustChangePassword(database: SqlJsDatabase, userId: string, mustChangePassword: boolean): Promise<void> {
      const timestamp = nowIso()
      await withTransaction(database, () => {
        exec(database, 'UPDATE usuarios SET must_change_password = ?, updated_at = ? WHERE id = ?;', [mustChangePassword ? 1 : 0, timestamp, userId])
      })
    },
  }

  const syncRepository = {
    async updateSyncState(database: SqlJsDatabase, input: SyncStateInput): Promise<void> {
      const timestamp = nowIso()
      await withTransaction(database, () => {
        exec(
          database,
          `INSERT OR REPLACE INTO sincronizacion (
            id, empresa_id, origen, estado, local_modified_at, remote_modified_at, last_synced_at, conflict_resolution, detalle, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM sincronizacion WHERE id = ?), ?), ?);`,
          [DATABASE_KEY, ROOT_COMPANY_ID, input.source, 'sincronizado', input.localModifiedAt, input.remoteModifiedAt, input.localModifiedAt, input.conflictResolution, input.detail, DATABASE_KEY, timestamp, timestamp],
        )
      })
    },
  }

  const categoryRepository = {
    list(database: SqlJsDatabase, includeInactive = false): ProductCategory[] {
      const rows = getRows<Record<string, unknown>>(
        database,
        `SELECT id, nombre AS name, slug, descripcion AS description, activo AS active, created_at, updated_at
         FROM categorias
         WHERE (? = 1 OR activo = 1)
         ORDER BY nombre COLLATE NOCASE ASC;`,
        [includeInactive ? 1 : 0],
      )

      return rows.map(mapCategory)
    },

    findById(database: SqlJsDatabase, id: string): ProductCategory | null {
      const row = getRow<Record<string, unknown>>(
        database,
        'SELECT id, nombre AS name, slug, descripcion AS description, activo AS active, created_at, updated_at FROM categorias WHERE id = ? LIMIT 1;',
        [id],
      )

      return row ? mapCategory(row) : null
    },

    async save(database: SqlJsDatabase, category: ProductCategoryInput): Promise<void> {
      const timestamp = nowIso()
      const slug = category.slug?.trim() || slugify(category.name)

      await withTransaction(database, () => {
        exec(
          database,
          `INSERT OR REPLACE INTO categorias (id, empresa_id, nombre, slug, descripcion, activo, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM categorias WHERE id = ?), ?), ?);`,
          [category.id, ROOT_COMPANY_ID, category.name.trim(), slug, category.description ?? null, category.active === false ? 0 : 1, category.id, timestamp, timestamp],
        )
      })
    },

    async delete(database: SqlJsDatabase, id: string): Promise<void> {
      await withTransaction(database, () => {
        exec(database, 'DELETE FROM categorias WHERE id = ?;', [id])
      })
    },
  }

  const productRepository = {
    list(database: SqlJsDatabase, filters: ProductFilters = {}): Product[] {
      const conditions: string[] = []
      const params: Array<string | number | null> = []

      if (filters.query?.trim()) {
        conditions.push('(LOWER(p.nombre) LIKE LOWER(?) OR LOWER(p.codigo) LIKE LOWER(?) OR LOWER(COALESCE(p.codigo_barras, \"\")) LIKE LOWER(?) OR LOWER(COALESCE(c.nombre, \"\")) LIKE LOWER(?))')
        const like = `%${filters.query.trim()}%`
        params.push(like, like, like, like)
      }

      if (filters.categoryId !== undefined && filters.categoryId !== null) {
        conditions.push('p.categoria_id = ?')
        params.push(filters.categoryId)
      }

      if (typeof filters.active === 'boolean') {
        conditions.push('p.activo = ?')
        params.push(filters.active ? 1 : 0)
      }

      if (typeof filters.lowStock === 'boolean' && filters.lowStock) {
        conditions.push('p.stock <= p.stock_minimo')
      }

      if (typeof filters.hasBarcode === 'boolean') {
        conditions.push(filters.hasBarcode ? 'p.codigo_barras IS NOT NULL AND p.codigo_barras <> \"\"' : '(p.codigo_barras IS NULL OR p.codigo_barras = \"\")')
      }

      if (typeof filters.minPurchasePrice === 'number') {
        conditions.push('p.precio_compra >= ?')
        params.push(filters.minPurchasePrice)
      }

      if (typeof filters.maxPurchasePrice === 'number') {
        conditions.push('p.precio_compra <= ?')
        params.push(filters.maxPurchasePrice)
      }

      if (typeof filters.minSalePrice === 'number') {
        conditions.push('p.precio_venta >= ?')
        params.push(filters.minSalePrice)
      }

      if (typeof filters.maxSalePrice === 'number') {
        conditions.push('p.precio_venta <= ?')
        params.push(filters.maxSalePrice)
      }

      const sortMap: Record<NonNullable<ProductFilters['sortBy']>, string> = {
        name: 'p.nombre',
        code: 'p.codigo',
        salePrice: 'p.precio_venta',
        purchasePrice: 'p.precio_compra',
        stock: 'p.stock',
        updatedAt: 'p.updated_at',
      }

      const sortBy = sortMap[filters.sortBy ?? 'name'] ?? 'p.nombre'
      const sortDirection = filters.sortDirection === 'asc' ? 'ASC' : 'DESC'
      const limit = typeof filters.limit === 'number' ? Math.max(0, filters.limit) : 200
      const offset = typeof filters.offset === 'number' ? Math.max(0, filters.offset) : 0

      const whereClause = conditions.length > 0 ? `WHERE p.empresa_id = ? AND ${conditions.join(' AND ')}` : 'WHERE p.empresa_id = ?'
      const query = `
        SELECT
          p.id,
          p.categoria_id,
          c.nombre AS category_name,
          c.slug AS category_slug,
          p.nombre,
          p.descripcion,
          p.codigo,
          p.codigo_barras AS barcode,
          p.imagen_url,
          p.precio_compra,
          p.precio_venta,
          p.stock,
          p.stock_minimo,
          p.activo AS active,
          p.created_at,
          p.updated_at
        FROM productos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        ${whereClause}
        ORDER BY ${sortBy} ${sortDirection}, p.nombre COLLATE NOCASE ASC
        LIMIT ? OFFSET ?;`

      const rows = getRows<Record<string, unknown>>(database, query, [ROOT_COMPANY_ID, ...params, limit, offset])
      return rows.map(mapProduct)
    },

    search(database: SqlJsDatabase, query: string, filters: Omit<ProductFilters, 'query'> = {}): Product[] {
      return this.list(database, { ...filters, query })
    },

    findById(database: SqlJsDatabase, id: string): Product | null {
      const row = getRow<Record<string, unknown>>(
        database,
        `SELECT
          p.id,
          p.categoria_id,
          c.nombre AS category_name,
          c.slug AS category_slug,
          p.nombre,
          p.descripcion,
          p.codigo,
          p.codigo_barras AS barcode,
          p.imagen_url,
          p.precio_compra,
          p.precio_venta,
          p.stock,
          p.stock_minimo,
          p.activo AS active,
          p.created_at,
          p.updated_at
         FROM productos p
         LEFT JOIN categorias c ON c.id = p.categoria_id
         WHERE p.id = ? AND p.empresa_id = ?
         LIMIT 1;`,
        [id, ROOT_COMPANY_ID],
      )

      return row ? mapProduct(row) : null
    },

    findByBarcode(database: SqlJsDatabase, barcode: string): Product | null {
      const row = getRow<Record<string, unknown>>(
        database,
        `SELECT
          p.id,
          p.categoria_id,
          c.nombre AS category_name,
          c.slug AS category_slug,
          p.nombre,
          p.descripcion,
          p.codigo,
          p.codigo_barras AS barcode,
          p.imagen_url,
          p.precio_compra,
          p.precio_venta,
          p.stock,
          p.stock_minimo,
          p.activo AS active,
          p.created_at,
          p.updated_at
         FROM productos p
         LEFT JOIN categorias c ON c.id = p.categoria_id
         WHERE p.empresa_id = ? AND LOWER(COALESCE(p.codigo_barras, '')) = LOWER(?)
         LIMIT 1;`,
        [ROOT_COMPANY_ID, barcode],
      )

      return row ? mapProduct(row) : null
    },

    async save(database: SqlJsDatabase, product: ProductInput): Promise<void> {
      const timestamp = nowIso()
      const categoryId = product.categoryId ?? null
      const barcode = product.barcode?.trim() || null

      await withTransaction(database, () => {
        exec(
          database,
          `INSERT OR REPLACE INTO productos (
            id, empresa_id, categoria_id, nombre, descripcion, codigo, codigo_barras, imagen_url,
            precio_compra, precio_venta, stock, stock_minimo, activo, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM productos WHERE id = ?), ?), ?);`,
          [
            product.id,
            ROOT_COMPANY_ID,
            categoryId,
            product.name.trim(),
            product.description ?? null,
            product.code.trim(),
            barcode,
            product.imageUrl ?? null,
            product.purchasePrice ?? 0,
            product.salePrice ?? 0,
            product.stock ?? 0,
            product.stockMin ?? 0,
            product.active === false ? 0 : 1,
            product.id,
            timestamp,
            timestamp,
          ],
        )
      })
    },

    async delete(database: SqlJsDatabase, id: string): Promise<void> {
      await withTransaction(database, () => {
        exec(database, 'DELETE FROM productos WHERE id = ? AND empresa_id = ?;', [id, ROOT_COMPANY_ID])
      })
    },

    async updateStock(database: SqlJsDatabase, id: string, stock: number): Promise<void> {
      const timestamp = nowIso()
      await withTransaction(database, () => {
        exec(database, 'UPDATE productos SET stock = ?, updated_at = ? WHERE id = ? AND empresa_id = ?;', [stock, timestamp, id, ROOT_COMPANY_ID])
      })
    },
  }

  const extraRepository = {
    list(database: SqlJsDatabase, includeInactive = false): Extra[] {
      const rows = getRows<Record<string, unknown>>(
        database,
        `SELECT id, nombre AS name, descripcion, precio, activo, created_at, updated_at
         FROM extras
         WHERE empresa_id = ? AND (? = 1 OR activo = 1)
         ORDER BY nombre COLLATE NOCASE ASC;`,
        [ROOT_COMPANY_ID, includeInactive ? 1 : 0],
      )

      return rows.map(mapExtra)
    },

    findById(database: SqlJsDatabase, id: string): Extra | null {
      const row = getRow<Record<string, unknown>>(
        database,
        'SELECT id, nombre AS name, descripcion, precio, activo, created_at, updated_at FROM extras WHERE id = ? AND empresa_id = ? LIMIT 1;',
        [id, ROOT_COMPANY_ID],
      )

      return row ? mapExtra(row) : null
    },

    async save(database: SqlJsDatabase, extra: ExtraInput): Promise<void> {
      const timestamp = nowIso()
      await withTransaction(database, () => {
        exec(
          database,
          `INSERT OR REPLACE INTO extras (id, empresa_id, nombre, descripcion, precio, activo, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM extras WHERE id = ?), ?), ?);`,
          [extra.id, ROOT_COMPANY_ID, extra.name.trim(), extra.description ?? null, extra.price ?? 0, extra.active === false ? 0 : 1, extra.id, timestamp, timestamp],
        )
      })
    },

    async delete(database: SqlJsDatabase, id: string): Promise<void> {
      await withTransaction(database, () => {
        exec(database, 'DELETE FROM extras WHERE id = ? AND empresa_id = ?;', [id, ROOT_COMPANY_ID])
      })
    },

    listByProduct(database: SqlJsDatabase, productId: string): Extra[] {
      const rows = getRows<Record<string, unknown>>(
        database,
        `SELECT e.id, e.nombre AS name, e.descripcion, e.precio, e.activo, e.created_at, e.updated_at
         FROM extras e
         INNER JOIN producto_extra pe ON pe.extra_id = e.id
         WHERE pe.producto_id = ? AND e.empresa_id = ?
         ORDER BY e.nombre COLLATE NOCASE ASC;`,
        [productId, ROOT_COMPANY_ID],
      )

      return rows.map(mapExtra)
    },

    async setByProduct(database: SqlJsDatabase, productId: string, extraIds: string[]): Promise<void> {
      const uniqueExtraIds = Array.from(new Set(extraIds.filter(Boolean)))

      await withTransaction(database, () => {
        exec(database, 'DELETE FROM producto_extra WHERE producto_id = ?;', [productId])

        for (const extraId of uniqueExtraIds) {
          exec(database, 'INSERT OR REPLACE INTO producto_extra (producto_id, extra_id, created_at) VALUES (?, ?, ?);', [productId, extraId, nowIso()])
        }
      })
    },
  }

  const cashRepository = {
    findOpenByUser(database: SqlJsDatabase, userId: string): CashRegister | null {
      const row = getRow<Record<string, unknown>>(
        database,
        `SELECT id, usuario_id, estado, apertura_at, cierre_at, saldo_inicial, saldo_final, diferencia, observaciones, created_at, updated_at
         FROM caja
         WHERE empresa_id = ? AND usuario_id = ? AND estado = 'abierta'
         ORDER BY apertura_at DESC
         LIMIT 1;`,
        [ROOT_COMPANY_ID, userId],
      )

      return row ? mapCashRegister(row) : null
    },

    listRegisters(database: SqlJsDatabase, filters: { userId?: string; status?: CashRegisterStatus; limit?: number; offset?: number } = {}): CashRegister[] {
      const conditions: string[] = ['empresa_id = ?']
      const params: Array<string | number | null> = [ROOT_COMPANY_ID]

      if (filters.userId) {
        conditions.push('usuario_id = ?')
        params.push(filters.userId)
      }

      if (filters.status) {
        conditions.push('estado = ?')
        params.push(filters.status)
      }

      const rows = getRows<Record<string, unknown>>(
        database,
        `SELECT id, usuario_id, estado, apertura_at, cierre_at, saldo_inicial, saldo_final, diferencia, observaciones, created_at, updated_at
         FROM caja
         WHERE ${conditions.join(' AND ')}
         ORDER BY apertura_at DESC, created_at DESC
         LIMIT ? OFFSET ?;`,
        [...params, Math.max(0, filters.limit ?? 200), Math.max(0, filters.offset ?? 0)],
      )

      return rows.map(mapCashRegister)
    },

    listMovements(database: SqlJsDatabase, filters: { cashRegisterId?: string; userId?: string; type?: CashMovementType; limit?: number; offset?: number } = {}): CashMovement[] {
      const conditions: string[] = ['1 = 1']
      const params: Array<string | number | null> = []

      if (filters.cashRegisterId) {
        conditions.push('caja_id = ?')
        params.push(filters.cashRegisterId)
      }

      if (filters.userId) {
        conditions.push('usuario_id = ?')
        params.push(filters.userId)
      }

      if (filters.type) {
        conditions.push('tipo = ?')
        params.push(filters.type)
      }

      const rows = getRows<Record<string, unknown>>(
        database,
        `SELECT id, caja_id, usuario_id, tipo, concepto, monto, referencia, created_at
         FROM movimientos_caja
         WHERE ${conditions.join(' AND ')}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?;`,
        [...params, Math.max(0, filters.limit ?? 500), Math.max(0, filters.offset ?? 0)],
      )

      return rows.map(mapCashMovement)
    },

    listCuts(database: SqlJsDatabase, filters: { cashRegisterId?: string; userId?: string; limit?: number; offset?: number } = {}): CashCut[] {
      const conditions: string[] = ['1 = 1']
      const params: Array<string | number | null> = []

      if (filters.cashRegisterId) {
        conditions.push('caja_id = ?')
        params.push(filters.cashRegisterId)
      }

      if (filters.userId) {
        conditions.push('usuario_id = ?')
        params.push(filters.userId)
      }

      const rows = getRows<Record<string, unknown>>(
        database,
        `SELECT id, caja_id, usuario_id, total_ingresos, total_egresos, total_retiros, total_devoluciones, total_ventas, arqueo, diferencia, created_at
         FROM cortes_caja
         WHERE ${conditions.join(' AND ')}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?;`,
        [...params, Math.max(0, filters.limit ?? 200), Math.max(0, filters.offset ?? 0)],
      )

      return rows.map(mapCashCut)
    },

    async open(database: SqlJsDatabase, input: CashRegisterInput): Promise<CashRegister> {
      const timestamp = nowIso()
      const existingOpen = this.findOpenByUser(database, input.userId)

      if (existingOpen) {
        throw new Error('Ya existe una caja abierta para este usuario')
      }

      const cashRegisterId = input.id
      const openingAmount = input.openingAmount ?? 0
      const observations = input.observations ?? null

      await withTransaction(database, () => {
        exec(
          database,
          `INSERT INTO caja (
            id, empresa_id, usuario_id, estado, apertura_at, cierre_at, saldo_inicial, saldo_final, diferencia, observaciones, created_at, updated_at
          ) VALUES (?, ?, ?, 'abierta', ?, NULL, ?, NULL, NULL, ?, ?, ?);`,
          [cashRegisterId, ROOT_COMPANY_ID, input.userId, timestamp, openingAmount, observations, timestamp, timestamp],
        )
      })

      const created = this.findOpenByUser(database, input.userId)
      if (!created) {
        throw new Error('No se pudo abrir la caja')
      }

      return created
    },

    async close(database: SqlJsDatabase, cashRegisterId: string, closingAmount: number, observations: string | null = null): Promise<CashRegister> {
      const current = getRow<Record<string, unknown>>(
        database,
        'SELECT id, usuario_id, estado, apertura_at, cierre_at, saldo_inicial, saldo_final, diferencia, observaciones, created_at, updated_at FROM caja WHERE id = ? AND empresa_id = ? LIMIT 1;',
        [cashRegisterId, ROOT_COMPANY_ID],
      )

      if (!current) {
        throw new Error('Caja no encontrada')
      }

      if (String(current.estado) === 'cerrada') {
        return mapCashRegister(current)
      }

      const movements = this.listMovements(database, { cashRegisterId })
      const totalIncome = movements.filter((movement) => movement.type === 'ingreso' || movement.type === 'devolucion').reduce((sum, movement) => sum + movement.amount, 0)
      const totalExpense = movements.filter((movement) => movement.type === 'egreso' || movement.type === 'retiro').reduce((sum, movement) => sum + movement.amount, 0)
      const expectedCash = Number(current.saldo_inicial) + totalIncome - totalExpense
      const difference = closingAmount - expectedCash
      const timestamp = nowIso()

      await withTransaction(database, () => {
        exec(
          database,
          'UPDATE caja SET estado = ?, cierre_at = ?, saldo_final = ?, diferencia = ?, observaciones = COALESCE(?, observaciones), updated_at = ? WHERE id = ? AND empresa_id = ?;',
          ['cerrada', timestamp, closingAmount, difference, observations, timestamp, cashRegisterId, ROOT_COMPANY_ID],
        )

        exec(
          database,
          `INSERT INTO cortes_caja (
            id, caja_id, usuario_id, total_ingresos, total_egresos, total_retiros, total_devoluciones, total_ventas, arqueo, diferencia, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [randomId('corte'), cashRegisterId, String(current.usuario_id), totalIncome, totalExpense - movements.filter((movement) => movement.type === 'retiro').reduce((sum, movement) => sum + movement.amount, 0), movements.filter((movement) => movement.type === 'retiro').reduce((sum, movement) => sum + movement.amount, 0), movements.filter((movement) => movement.type === 'devolucion').reduce((sum, movement) => sum + movement.amount, 0), 0, closingAmount, difference, timestamp],
        )
      })

      const updated = getRow<Record<string, unknown>>(
        database,
        'SELECT id, usuario_id, estado, apertura_at, cierre_at, saldo_inicial, saldo_final, diferencia, observaciones, created_at, updated_at FROM caja WHERE id = ? AND empresa_id = ? LIMIT 1;',
        [cashRegisterId, ROOT_COMPANY_ID],
      )

      if (!updated) {
        throw new Error('No se pudo cerrar la caja')
      }

      return mapCashRegister(updated)
    },

    async registerMovement(database: SqlJsDatabase, input: CashMovementInput): Promise<CashMovement> {
      const openCash = this.findOpenByUser(database, input.userId)

      if (!openCash || openCash.id !== input.cashRegisterId) {
        throw new Error('La caja no está abierta para este usuario')
      }

      const timestamp = nowIso()

      await withTransaction(database, () => {
        exec(
          database,
          'INSERT INTO movimientos_caja (id, caja_id, usuario_id, tipo, concepto, monto, referencia, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
          [input.id, input.cashRegisterId, input.userId, input.type, input.concept, input.amount, input.reference ?? null, timestamp],
        )
      })

      const created = getRow<Record<string, unknown>>(
        database,
        'SELECT id, caja_id, usuario_id, tipo, concepto, monto, referencia, created_at FROM movimientos_caja WHERE id = ? LIMIT 1;',
        [input.id],
      )

      if (!created) {
        throw new Error('No se pudo registrar el movimiento de caja')
      }

      return mapCashMovement(created)
    },

    async registerCut(database: SqlJsDatabase, input: CashCutInput): Promise<CashCut> {
      const openCash = this.findOpenByUser(database, input.userId)

      if (!openCash || openCash.id !== input.cashRegisterId) {
        throw new Error('La caja no está abierta para este usuario')
      }

      const movements = this.listMovements(database, { cashRegisterId: input.cashRegisterId })
      const totalIncome = movements.filter((movement) => movement.type === 'ingreso' || movement.type === 'devolucion').reduce((sum, movement) => sum + movement.amount, 0)
      const totalExpense = movements.filter((movement) => movement.type === 'egreso').reduce((sum, movement) => sum + movement.amount, 0)
      const totalWithdrawals = movements.filter((movement) => movement.type === 'retiro').reduce((sum, movement) => sum + movement.amount, 0)
      const totalReturns = movements.filter((movement) => movement.type === 'devolucion').reduce((sum, movement) => sum + movement.amount, 0)
      const totalSales = 0
      const difference = input.cashCount - (Number(openCash.openingAmount) + totalIncome - (totalExpense + totalWithdrawals))
      const timestamp = nowIso()

      await withTransaction(database, () => {
        exec(
          database,
          `INSERT INTO cortes_caja (
            id, caja_id, usuario_id, total_ingresos, total_egresos, total_retiros, total_devoluciones, total_ventas, arqueo, diferencia, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [input.id, input.cashRegisterId, input.userId, totalIncome, totalExpense, totalWithdrawals, totalReturns, totalSales, input.cashCount, difference, timestamp],
        )
      })

      const created = getRow<Record<string, unknown>>(
        database,
        'SELECT id, caja_id, usuario_id, total_ingresos, total_egresos, total_retiros, total_devoluciones, total_ventas, arqueo, diferencia, created_at FROM cortes_caja WHERE id = ? LIMIT 1;',
        [input.id],
      )

      if (!created) {
        throw new Error('No se pudo registrar el corte de caja')
      }

      return mapCashCut(created)
    },
  }

  const saleRepository = {
    getIvaRate(database: SqlJsDatabase): number {
      const row = getRow<{ iva_porcentaje: number }>(database, 'SELECT iva_porcentaje FROM configuracion WHERE empresa_id = ? LIMIT 1;', [ROOT_COMPANY_ID])
      return row ? roundMoney(Number(row.iva_porcentaje)) : 16
    },

    listDetails(database: SqlJsDatabase, saleId: string): SaleDetail[] {
      const detailRows = getRows<Record<string, unknown>>(
        database,
        `SELECT d.id, d.producto_id AS product_id, p.nombre AS product_name, d.cantidad, d.precio_unitario, d.subtotal, d.created_at
         FROM detalle_venta d
         INNER JOIN productos p ON p.id = d.producto_id
         WHERE d.venta_id = ?
         ORDER BY d.created_at ASC;`,
        [saleId],
      )

      return detailRows.map((detailRow) => {
        const extraRows = getRows<Record<string, unknown>>(
          database,
          `SELECT de.extra_id, e.nombre AS extra_name, e.precio AS price
           FROM detalle_extra de
           INNER JOIN extras e ON e.id = de.extra_id
           WHERE de.detalle_venta_id = ?
           ORDER BY e.nombre COLLATE NOCASE ASC;`,
          [String(detailRow.id)],
        )

        return mapSaleDetail({ ...detailRow, extras: extraRows })
      })
    },

    listPayments(database: SqlJsDatabase, saleId: string): SalePayment[] {
      const rows = getRows<Record<string, unknown>>(
        database,
        'SELECT id, metodo_pago, monto, referencia, created_at FROM venta_pagos WHERE venta_id = ? ORDER BY created_at ASC;',
        [saleId],
      )

      return rows.map(mapSalePayment)
    },

    findHeader(database: SqlJsDatabase, saleId: string): Omit<Sale, 'details' | 'payments'> | null {
      const row = getRow<Record<string, unknown>>(
        database,
        `SELECT
          v.id,
          v.numero,
          v.usuario_id AS user_id,
          u.nombre AS user_name,
          v.cliente_id AS customer_id,
          c.nombre AS customer_name,
          v.estado,
          v.fecha,
          v.subtotal,
          v.iva,
          v.descuento,
          v.total,
          v.metodo_pago,
          v.notas,
          v.motivo_cancelacion,
          v.cancelado_at,
          v.created_at,
          v.updated_at,
          cfg.iva_porcentaje
         FROM ventas v
         INNER JOIN usuarios u ON u.id = v.usuario_id
         LEFT JOIN clientes c ON c.id = v.cliente_id
         LEFT JOIN configuracion cfg ON cfg.empresa_id = v.empresa_id
         WHERE v.id = ? AND v.empresa_id = ?
         LIMIT 1;`,
        [saleId, ROOT_COMPANY_ID],
      )

      return row ? mapSaleHeader(row) : null
    },

    findById(database: SqlJsDatabase, saleId: string): Sale | null {
      const header = this.findHeader(database, saleId)
      if (!header) {
        return null
      }

      return {
        ...header,
        details: this.listDetails(database, saleId),
        payments: this.listPayments(database, saleId),
      }
    },

    list(database: SqlJsDatabase, filters: SaleFilters = {}): Sale[] {
      const conditions: string[] = ['v.empresa_id = ?']
      const params: Array<string | number | null> = [ROOT_COMPANY_ID]

      if (filters.query?.trim()) {
        const like = `%${filters.query.trim()}%`
        conditions.push('(v.numero LIKE ? OR u.nombre LIKE ? OR COALESCE(c.nombre, \"\") LIKE ? OR v.notas LIKE ?)')
        params.push(like, like, like, like)
      }

      if (filters.status) {
        conditions.push('v.estado = ?')
        params.push(filters.status)
      }

      if (filters.userId) {
        conditions.push('v.usuario_id = ?')
        params.push(filters.userId)
      }

      if (filters.customerId) {
        conditions.push('v.cliente_id = ?')
        params.push(filters.customerId)
      }

      if (filters.fromDate) {
        conditions.push('v.fecha >= ?')
        params.push(filters.fromDate)
      }

      if (filters.toDate) {
        conditions.push('v.fecha <= ?')
        params.push(filters.toDate)
      }

      const rows = getRows<Record<string, unknown>>(
        database,
        `SELECT
          v.id,
          v.numero,
          v.usuario_id AS user_id,
          u.nombre AS user_name,
          v.cliente_id AS customer_id,
          c.nombre AS customer_name,
          v.estado,
          v.fecha,
          v.subtotal,
          v.iva,
          v.descuento,
          v.total,
          v.metodo_pago,
          v.notas,
          v.motivo_cancelacion,
          v.cancelado_at,
          v.created_at,
          v.updated_at,
          cfg.iva_porcentaje
         FROM ventas v
         INNER JOIN usuarios u ON u.id = v.usuario_id
         LEFT JOIN clientes c ON c.id = v.cliente_id
         LEFT JOIN configuracion cfg ON cfg.empresa_id = v.empresa_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY v.fecha DESC, v.created_at DESC
         LIMIT ? OFFSET ?;`,
        [...params, Math.max(0, filters.limit ?? 200), Math.max(0, filters.offset ?? 0)],
      )

      return rows.map((row) => {
        const header = mapSaleHeader(row)
        return {
          ...header,
          details: this.listDetails(database, header.id),
          payments: this.listPayments(database, header.id),
        }
      })
    },

    async create(database: SqlJsDatabase, input: SaleInput): Promise<Sale> {
      const ivaRate = this.getIvaRate(database)
      const saleNumber = input.number?.trim() || `V-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}-${randomId('s').slice(-6)}`
      const createdAt = nowIso()
      const discount = roundMoney(Math.max(0, input.discount ?? 0))
      const resolvedDetails: Array<SaleDetail & { productStockBefore: number; productStockAfter: number; productSalePrice: number }> = []
      const paymentRows = input.payments?.length ? input.payments : [
        { id: randomId('sale-pay'), method: input.paymentMethod?.trim() || 'efectivo', amount: 0, reference: null },
      ]

      for (const detailInput of input.details) {
        const product = productRepository.findById(database, detailInput.productId)
        if (!product) {
          throw new Error(`Producto no encontrado: ${detailInput.productId}`)
        }

        if (!product.active) {
          throw new Error(`El producto ${product.name} está inactivo`)
        }

        const allowedExtras = extraRepository.listByProduct(database, detailInput.productId)
        const allowedExtraIds = new Set(allowedExtras.map((extra) => extra.id))
        const selectedExtraIds = Array.from(new Set((detailInput.extras ?? []).map((extra) => extra.extraId).filter(Boolean)))

        for (const extraId of selectedExtraIds) {
          if (!allowedExtraIds.has(extraId)) {
            throw new Error(`El extra ${extraId} no está asociado al producto ${product.name}`)
          }
        }

        const extraPrice = selectedExtraIds.reduce((sum, extraId) => {
          const extra = allowedExtras.find((item) => item.id === extraId)
          return sum + (extra ? extra.price : 0)
        }, 0)

        const quantity = Math.max(0, detailInput.quantity)
        if (quantity <= 0) {
          throw new Error(`La cantidad del producto ${product.name} debe ser mayor que cero`)
        }

        if (product.stock < quantity) {
          throw new Error(`Stock insuficiente para ${product.name}`)
        }

        const unitPrice = roundMoney(detailInput.unitPrice ?? product.salePrice)
        const subtotal = roundMoney(quantity * (unitPrice + extraPrice))
        resolvedDetails.push({
          id: detailInput.id,
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice,
          subtotal,
          extras: selectedExtraIds.map((extraId) => {
            const extra = allowedExtras.find((item) => item.id === extraId)
            return {
              extraId,
              extraName: extra?.name ?? extraId,
              price: extra?.price ?? 0,
            }
          }),
          createdAt,
          productStockBefore: product.stock,
          productStockAfter: product.stock - quantity,
          productSalePrice: product.salePrice,
        })
      }

      const subtotal = roundMoney(resolvedDetails.reduce((sum, detail) => sum + detail.subtotal, 0))
      const taxable = roundMoney(Math.max(0, subtotal - discount))
      const iva = roundMoney((taxable * ivaRate) / 100)
      const total = roundMoney(taxable + iva)
      const payments = paymentRows.map((payment) => ({ ...payment, amount: roundMoney(payment.amount) }))

      if (payments.length === 1 && payments[0].amount === 0) {
        payments[0].amount = total
      }

      const resolvedPaymentTotal = roundMoney(payments.reduce((sum, payment) => sum + payment.amount, 0))
      if (Math.abs(resolvedPaymentTotal - total) > 0.01) {
        throw new Error('El total de los pagos no coincide con el total de la venta')
      }

      const paymentMethod = input.paymentMethod?.trim() || payments.map((payment) => payment.method).join(', ')
      const headerId = input.id
      const productAdjustments = resolvedDetails.map((detail) => ({ productId: detail.productId, delta: -detail.quantity, reference: headerId }))

      await withTransaction(database, () => {
        exec(
          database,
          `INSERT INTO ventas (
            id, empresa_id, usuario_id, cliente_id, numero, fecha, subtotal, iva, descuento, total, metodo_pago, estado, notas, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'abierta', ?, ?, ?);`,
          [headerId, ROOT_COMPANY_ID, input.userId, input.customerId ?? null, saleNumber, createdAt, subtotal, iva, discount, total, paymentMethod, input.notes ?? null, createdAt, createdAt],
        )

        for (const detail of resolvedDetails) {
          exec(
            database,
            'INSERT INTO detalle_venta (id, venta_id, producto_id, cantidad, precio_unitario, subtotal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
            [detail.id, headerId, detail.productId, detail.quantity, detail.unitPrice, detail.subtotal, createdAt],
          )

          for (const extra of detail.extras) {
            exec(
              database,
              'INSERT INTO detalle_extra (id, detalle_venta_id, extra_id, cantidad, precio_unitario, subtotal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
              [randomId('detalle-extra'), detail.id, extra.extraId, detail.quantity, extra.price, roundMoney(extra.price * detail.quantity), createdAt],
            )
          }
        }

        for (const payment of payments) {
          exec(
            database,
            'INSERT INTO venta_pagos (id, venta_id, metodo_pago, monto, referencia, created_at) VALUES (?, ?, ?, ?, ?, ?);',
            [payment.id, headerId, payment.method, payment.amount, payment.reference ?? null, createdAt],
          )
        }

        for (const adjustment of productAdjustments) {
          this.applyInventoryChange(database, adjustment.productId, adjustment.delta, headerId, input.userId, 'venta')
        }
      })

      const sale = this.findById(database, headerId)
      if (!sale) {
        throw new Error('No se pudo crear la venta')
      }

      return sale
    },

    async update(database: SqlJsDatabase, saleId: string, input: SaleInput): Promise<Sale> {
      const current = this.findById(database, saleId)
      if (!current) {
        throw new Error('Venta no encontrada')
      }

      if (current.status === 'cancelada') {
        throw new Error('No se puede editar una venta cancelada')
      }

      await withTransaction(database, () => {
        for (const detail of current.details) {
          this.applyInventoryChange(database, detail.productId, detail.quantity, saleId, current.userId, 'reversion-venta')
        }

        exec(database, 'DELETE FROM detalle_extra WHERE detalle_venta_id IN (SELECT id FROM detalle_venta WHERE venta_id = ?);', [saleId])
        exec(database, 'DELETE FROM detalle_venta WHERE venta_id = ?;', [saleId])
        exec(database, 'DELETE FROM venta_pagos WHERE venta_id = ?;', [saleId])

        const updatedSale = this.prepareSaleDraft(database, saleId, input, current)

        exec(
          database,
          `UPDATE ventas SET
            usuario_id = ?, cliente_id = ?, numero = ?, fecha = ?, subtotal = ?, iva = ?, descuento = ?, total = ?, metodo_pago = ?, notas = ?, updated_at = ?
           WHERE id = ? AND empresa_id = ?;`,
          [input.userId, input.customerId ?? null, updatedSale.number, updatedSale.date, updatedSale.subtotal, updatedSale.iva, updatedSale.discount, updatedSale.total, updatedSale.paymentMethod, updatedSale.notes ?? null, updatedSale.updatedAt, saleId, ROOT_COMPANY_ID],
        )

        for (const detail of updatedSale.details) {
          exec(
            database,
            'INSERT INTO detalle_venta (id, venta_id, producto_id, cantidad, precio_unitario, subtotal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
            [detail.id, saleId, detail.productId, detail.quantity, detail.unitPrice, detail.subtotal, updatedSale.createdAt],
          )

          for (const extra of detail.extras) {
            exec(
              database,
              'INSERT INTO detalle_extra (id, detalle_venta_id, extra_id, cantidad, precio_unitario, subtotal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
              [randomId('detalle-extra'), detail.id, extra.extraId, detail.quantity, extra.price, roundMoney(extra.price * detail.quantity), updatedSale.createdAt],
            )
          }
        }

        for (const payment of updatedSale.payments) {
          exec(
            database,
            'INSERT INTO venta_pagos (id, venta_id, metodo_pago, monto, referencia, created_at) VALUES (?, ?, ?, ?, ?, ?);',
            [payment.id, saleId, payment.method, payment.amount, payment.reference, updatedSale.createdAt],
          )
        }

        for (const detail of updatedSale.details) {
          this.applyInventoryChange(database, detail.productId, -detail.quantity, saleId, input.userId, 'venta-edicion')
        }
      })

      const sale = this.findById(database, saleId)
      if (!sale) {
        throw new Error('No se pudo editar la venta')
      }

      return sale
    },

    async cancel(database: SqlJsDatabase, saleId: string, reason: string | null = null): Promise<Sale> {
      const current = this.findById(database, saleId)
      if (!current) {
        throw new Error('Venta no encontrada')
      }

      if (current.status === 'cancelada') {
        return current
      }

      const cancelledAt = nowIso()

      await withTransaction(database, () => {
        for (const detail of current.details) {
          this.applyInventoryChange(database, detail.productId, detail.quantity, saleId, current.userId, 'cancelacion-venta')
        }

        exec(
          database,
          'UPDATE ventas SET estado = ?, cancelado_at = ?, motivo_cancelacion = ?, updated_at = ? WHERE id = ? AND empresa_id = ?;',
          ['cancelada', cancelledAt, reason ?? null, cancelledAt, saleId, ROOT_COMPANY_ID],
        )
      })

      const sale = this.findById(database, saleId)
      if (!sale) {
        throw new Error('No se pudo cancelar la venta')
      }

      return sale
    },

    prepareSaleDraft(database: SqlJsDatabase, saleId: string, input: SaleInput, current?: Sale): Sale {
      const ivaRate = this.getIvaRate(database)
      const saleNumber = input.number?.trim() || current?.number || `V-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}-${randomId('s').slice(-6)}`
      const saleDate = current?.date ?? nowIso()
      const discount = roundMoney(Math.max(0, input.discount ?? current?.discount ?? 0))
      const paymentRows = input.payments?.length ? input.payments : (current?.payments ?? []).map((payment) => ({ ...payment, amount: payment.amount }))
      const details: SaleDetail[] = []

      for (const detailInput of input.details) {
        const product = productRepository.findById(database, detailInput.productId)
        if (!product) {
          throw new Error(`Producto no encontrado: ${detailInput.productId}`)
        }

        const allowedExtras = extraRepository.listByProduct(database, detailInput.productId)
        const allowedExtraIds = new Set(allowedExtras.map((extra) => extra.id))
        const selectedExtraIds = Array.from(new Set((detailInput.extras ?? []).map((extra) => extra.extraId).filter(Boolean)))

        for (const extraId of selectedExtraIds) {
          if (!allowedExtraIds.has(extraId)) {
            throw new Error(`El extra ${extraId} no está asociado al producto ${product.name}`)
          }
        }

        const extraPrice = selectedExtraIds.reduce((sum, extraId) => {
          const extra = allowedExtras.find((item) => item.id === extraId)
          return sum + (extra ? extra.price : 0)
        }, 0)

        const quantity = Math.max(0, detailInput.quantity)
        const unitPrice = roundMoney(detailInput.unitPrice ?? product.salePrice)
        const subtotal = roundMoney(quantity * (unitPrice + extraPrice))

        details.push({
          id: detailInput.id,
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice,
          subtotal,
          extras: selectedExtraIds.map((extraId) => {
            const extra = allowedExtras.find((item) => item.id === extraId)
            return {
              extraId,
              extraName: extra?.name ?? extraId,
              price: extra?.price ?? 0,
            }
          }),
          createdAt: nowIso(),
        })
      }

      const subtotal = roundMoney(details.reduce((sum, detail) => sum + detail.subtotal, 0))
      const taxable = roundMoney(Math.max(0, subtotal - discount))
      const iva = roundMoney((taxable * ivaRate) / 100)
      const total = roundMoney(taxable + iva)
      const payments = (paymentRows.length > 0 ? paymentRows : [{ id: randomId('sale-pay'), method: input.paymentMethod?.trim() || 'efectivo', amount: total, reference: null }]).map((payment) => ({
        id: payment.id,
        method: payment.method.trim(),
        amount: roundMoney(payment.amount),
        reference: payment.reference ?? null,
        createdAt: nowIso(),
      }))

      const paymentTotal = roundMoney(payments.reduce((sum, payment) => sum + payment.amount, 0))
      if (Math.abs(paymentTotal - total) > 0.01) {
        throw new Error('El total de los pagos no coincide con el total de la venta')
      }

      return {
        id: saleId,
        number: saleNumber,
        userId: input.userId,
        userName: current?.userName ?? null,
        customerId: input.customerId ?? current?.customerId ?? null,
        customerName: current?.customerName ?? null,
        status: 'abierta',
        date: saleDate,
        subtotal,
        ivaRate,
        iva,
        discount,
        total,
        paymentMethod: input.paymentMethod?.trim() || payments.map((payment) => payment.method).join(', '),
        notes: input.notes ?? current?.notes ?? null,
        cancelReason: null,
        cancelledAt: null,
        createdAt: current?.createdAt ?? saleDate,
        updatedAt: nowIso(),
        details,
        payments,
      }
    },

    applyInventoryChange(database: SqlJsDatabase, productId: string, delta: number, saleId: string, userId: string, reason: string): void {
      const product = productRepository.findById(database, productId)
      if (!product) {
        throw new Error(`Producto no encontrado: ${productId}`)
      }

      const timestamp = nowIso()
      const nextStock = roundMoney(product.stock + delta)
      if (nextStock < 0) {
        throw new Error(`Stock insuficiente para ${product.name}`)
      }

      exec(database, 'UPDATE productos SET stock = ?, updated_at = ? WHERE id = ? AND empresa_id = ?;', [nextStock, timestamp, productId, ROOT_COMPANY_ID])
      exec(
        database,
        `INSERT OR REPLACE INTO inventario (
          id, empresa_id, producto_id, stock_actual, stock_minimo, updated_at
        ) VALUES (
          COALESCE((SELECT id FROM inventario WHERE empresa_id = ? AND producto_id = ?), ?),
          ?, ?, ?, ?, ?
        );`,
        [ROOT_COMPANY_ID, productId, randomId('inv'), ROOT_COMPANY_ID, productId, nextStock, product.stockMin, timestamp],
      )
      exec(database, 'INSERT INTO movimientos_stock (id, empresa_id, producto_id, usuario_id, tipo, cantidad, referencia, motivo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);', [randomId('mov-stock'), ROOT_COMPANY_ID, productId, userId, reason, delta, saleId, reason, timestamp])
    },

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
       must_change_password = CASE
         WHEN last_login_at IS NULL THEN 1
         ELSE must_change_password
       END,
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

    await withTransaction(database, () => {
      exec(database, 'INSERT INTO empresa (id, nombre, razon_social, activo, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?);', [ROOT_COMPANY_ID, 'NovaPOS', 'NovaPOS', createdAt, createdAt])
      exec(database, 'INSERT INTO roles (id, slug, nombre, descripcion, activo, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?);', [ROLE_ADMIN_ID, 'admin', 'Administrador', 'Acceso total al sistema', createdAt, createdAt])
      exec(database, 'INSERT INTO roles (id, slug, nombre, descripcion, activo, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?);', [ROLE_SELLER_ID, 'seller', 'Vendedor', 'Acceso operativo limitado', createdAt, createdAt])
      exec(database, 'INSERT INTO configuracion (id, empresa_id, moneda, iva_porcentaje, timezone, tema, auto_sync_drive, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?);', [randomId('config'), ROOT_COMPANY_ID, 'MXN', 16, 'America/Mexico_City', 'light', createdAt, createdAt])
      exec(database, 'INSERT INTO usuarios (id, empresa_id, role_id, usuario, nombre, email, password_hash, password_salt, password_iterations, must_change_password, activo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?);', [DEFAULT_ADMIN_ID, ROOT_COMPANY_ID, ROLE_ADMIN_ID, 'admin', 'Administrador', 'admin', adminPassword.hash, adminPassword.salt, 310000, createdAt, createdAt])
      exec(database, 'INSERT INTO usuarios (id, empresa_id, role_id, usuario, nombre, email, password_hash, password_salt, password_iterations, must_change_password, activo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?);', [DEFAULT_SELLER_ID, ROOT_COMPANY_ID, ROLE_SELLER_ID, 'vendedor', 'Vendedor', 'vendedor', sellerPassword.hash, sellerPassword.salt, 310000, createdAt, createdAt])
      exec(database, 'INSERT INTO sincronizacion (id, empresa_id, origen, estado, local_modified_at, remote_modified_at, last_synced_at, conflict_resolution, detalle, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);', [DATABASE_KEY, ROOT_COMPANY_ID, 'seed', 'sincronizado', createdAt, null, createdAt, 'seeded', 'Base creada desde cero', createdAt, createdAt])
      exec(database, 'INSERT INTO backups (id, empresa_id, archivo_nombre, drive_file_id, local_sha256, remote_modified_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [randomId('backup'), ROOT_COMPANY_ID, DATABASE_FILE_NAME, null, '', null, createdAt, createdAt])
    })
  }

  const persistDatabase = async (source: SyncStateInput['source'], remoteModifiedAt: string | null = null, conflictResolution: SyncStateInput['conflictResolution'] = 'none', detail = ''): Promise<void> => {
    const persistTimeoutMs = 60000;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const withTimeout = async <T>(task: Promise<T>, label: string): Promise<T> => {
      return await Promise.race([
        task,
        new Promise<T>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error(`${label} tardó más de ${Math.round(persistTimeoutMs / 1000)} segundos`)), persistTimeoutMs);
        }),
      ]);
    };

    console.log('SQLite Paso 12: persistDatabase() start', { source, conflictResolution, hasRemoteModifiedAt: remoteModifiedAt !== null });

    try {
      const database = db!;
      console.log('SQLite persistDatabase: using existing db instance');

      const bytes = database.export();
      console.log('SQLite persistDatabase: export() done', bytes.length);

      const blob = toBlob(bytes);
      console.log('SQLite persistDatabase: Blob() done');
      console.log('SQLite persistDatabase: Blob size =', blob.size);

      const checksum = await withTimeout(sha256Hex(bytes), 'Cálculo de checksum de SQLite');
      console.log('SQLite persistDatabase: sha256Hex() done');

      const lastSavedAt = nowIso();
      snapshot = { lastSavedAt, checksum };

      await withTimeout(
        withTransaction(database, () => {
          exec(database, 'UPDATE sincronizacion SET origen = ?, estado = ?, local_modified_at = ?, remote_modified_at = ?, last_synced_at = ?, conflict_resolution = ?, detalle = ?, updated_at = ? WHERE id = ?;', [source, 'sincronizado', lastSavedAt, remoteModifiedAt, lastSavedAt, conflictResolution, detail || `Persistencia ${source}`, lastSavedAt, DATABASE_KEY]);
          exec(database, 'INSERT OR REPLACE INTO backups (id, empresa_id, archivo_nombre, drive_file_id, local_sha256, remote_modified_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM backups WHERE id = ?), ?), ?);', [DATABASE_KEY, ROOT_COMPANY_ID, DATABASE_FILE_NAME, null, checksum, remoteModifiedAt, DATABASE_KEY, lastSavedAt, lastSavedAt]);
        }),
        'Transacción de persistencia SQLite',
      );
      console.log('SQLite persistDatabase: withTransaction() done');

      await withTimeout(writePersistedDatabase({ blob, checksum, lastSavedAt }), 'Escritura IndexedDB de SQLite');
      console.log('SQLite persistDatabase: writePersistedDatabase() done');
    } catch (error) {
      console.error('SQLite persistDatabase failed', error);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      console.log('SQLite Paso 13: persistDatabase() done');
    }
  };

  const importDatabaseBlob = async (blob: Blob, source: SyncStateInput['source'], remoteModifiedAt: string | null = null, conflictResolution: SyncStateInput['conflictResolution'] = 'none', detail = ''): Promise<void> => {
    const sqlJs = await loadSqlJs()
    const bytes = new Uint8Array(await blob.arrayBuffer())

    if (db) {
      db.close()
    }

    db = new sqlJs.Database(bytes)
    applyDatabasePragmas(db)
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
      try {
        console.log('SQLite Paso 1: initialize:start')
        const sqlJs = await loadSqlJs()
        console.log('SQLite Paso 3: loadSqlJs:done')

        const persisted = await withTimeout(readPersistedDatabase(), 10_000, 'Lectura de IndexedDB para empresa.db')
        console.log('SQLite Paso 4: readPersistedDatabase:done', Boolean(persisted))

        if (persisted) {
          console.log('SQLite Paso 5: cargando base persistida')
          const bytes = new Uint8Array(await withTimeout(persisted.blob.arrayBuffer(), 10_000, 'Lectura del blob persistido de empresa.db'))
          db = new sqlJs.Database(bytes)
        } else {
          console.log('SQLite Paso 5: creando base vacía')
          db = new sqlJs.Database()
        }

        console.log('SQLite Paso 6: applyDatabasePragmas')
        applyDatabasePragmas(db)
        console.log('SQLite Paso 7: applyMigrations')
        applyMigrations(db)
        console.log('SQLite Paso 8: ensureSeedData:start')
        await withTimeout(ensureSeedData(db), 10_000, 'Seed inicial de SQLite')
        console.log('SQLite Paso 9: ensureSeedData:done')

        if (persisted) {
          snapshot = { lastSavedAt: persisted.lastSavedAt, checksum: persisted.checksum }
        }

// Persistence of the database is performed after initialization via persistIfNeeded()
initialized = true;
console.log('SQLite Paso 12: initialize:completed');
        initialized = true
        console.log('SQLite Paso 12: initialize:completed')
      } finally {
        loadingPromise = null
      }
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
    return userRepository.findByEmail(database, email)
  }

  const listCategories = async (includeInactive = false): Promise<ProductCategory[]> => {
    const database = await ensureDatabase()
    return categoryRepository.list(database, includeInactive)
  }

  const findCategoryById = async (id: string): Promise<ProductCategory | null> => {
    const database = await ensureDatabase()
    return categoryRepository.findById(database, id)
  }

  const saveCategory = async (category: ProductCategoryInput): Promise<void> => {
    const database = await ensureDatabase()
    await categoryRepository.save(database, category)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Categoría guardada')
  }

  const deleteCategory = async (id: string): Promise<void> => {
    const database = await ensureDatabase()
    await categoryRepository.delete(database, id)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Categoría eliminada')
  }

  const listProducts = async (filters: ProductFilters = {}): Promise<Product[]> => {
    const database = await ensureDatabase()
    return productRepository.list(database, filters)
  }

  const searchProducts = async (query: string, filters: Omit<ProductFilters, 'query'> = {}): Promise<Product[]> => {
    const database = await ensureDatabase()
    return productRepository.search(database, query, filters)
  }

  const findProductById = async (id: string): Promise<Product | null> => {
    const database = await ensureDatabase()
    return productRepository.findById(database, id)
  }

  const findProductByBarcode = async (barcode: string): Promise<Product | null> => {
    const database = await ensureDatabase()
    return productRepository.findByBarcode(database, barcode)
  }

  const saveProduct = async (product: ProductInput): Promise<void> => {
    const database = await ensureDatabase()
    await productRepository.save(database, product)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Producto guardado')
  }

  const deleteProduct = async (id: string): Promise<void> => {
    const database = await ensureDatabase()
    await productRepository.delete(database, id)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Producto eliminado')
  }

  const updateProductStock = async (id: string, stock: number): Promise<void> => {
    const database = await ensureDatabase()
    await productRepository.updateStock(database, id, stock)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Stock actualizado')
  }

  const listExtras = async (includeInactive = false): Promise<Extra[]> => {
    const database = await ensureDatabase()
    return extraRepository.list(database, includeInactive)
  }

  const findExtraById = async (id: string): Promise<Extra | null> => {
    const database = await ensureDatabase()
    return extraRepository.findById(database, id)
  }

  const saveExtra = async (extra: ExtraInput): Promise<void> => {
    const database = await ensureDatabase()
    await extraRepository.save(database, extra)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Extra guardado')
  }

  const deleteExtra = async (id: string): Promise<void> => {
    const database = await ensureDatabase()
    await extraRepository.delete(database, id)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Extra eliminado')
  }

  const listExtrasByProduct = async (productId: string): Promise<Extra[]> => {
    const database = await ensureDatabase()
    return extraRepository.listByProduct(database, productId)
  }

  const setProductExtras = async (productId: string, extraIds: string[]): Promise<void> => {
    const database = await ensureDatabase()
    await extraRepository.setByProduct(database, productId, extraIds)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Extras asignados al producto')
  }

  const findSaleById = async (id: string): Promise<Sale | null> => {
    const database = await ensureDatabase()
    return saleRepository.findById(database, id)
  }

  const listSaleDetails = async (saleId: string): Promise<SaleDetail[]> => {
    const database = await ensureDatabase()
    return saleRepository.listDetails(database, saleId)
  }

  const listSalePayments = async (saleId: string): Promise<SalePayment[]> => {
    const database = await ensureDatabase()
    return saleRepository.listPayments(database, saleId)
  }

  const listSales = async (filters: SaleFilters = {}): Promise<Sale[]> => {
    const database = await ensureDatabase()
    return saleRepository.list(database, filters)
  }

  const createSale = async (input: SaleInput): Promise<Sale> => {
    const database = await ensureDatabase()
    const sale = await saleRepository.create(database, input)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Venta creada')
    return sale
  }

  const updateSale = async (id: string, input: SaleInput): Promise<Sale> => {
    const database = await ensureDatabase()
    const sale = await saleRepository.update(database, id, input)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Venta actualizada')
    return sale
  }

  const cancelSale = async (id: string, reason: string | null = null): Promise<Sale> => {
    const database = await ensureDatabase()
    const sale = await saleRepository.cancel(database, id, reason)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Venta cancelada')
    return sale
  }

  const findOpenCashRegisterByUser = async (userId: string): Promise<CashRegister | null> => {
    const database = await ensureDatabase()
    return cashRepository.findOpenByUser(database, userId)
  }

  const listCashRegisters = async (filters: { userId?: string; status?: CashRegisterStatus; limit?: number; offset?: number } = {}): Promise<CashRegister[]> => {
    const database = await ensureDatabase()
    return cashRepository.listRegisters(database, filters)
  }

  const listCashMovements = async (filters: { cashRegisterId?: string; userId?: string; type?: CashMovementType; limit?: number; offset?: number } = {}): Promise<CashMovement[]> => {
    const database = await ensureDatabase()
    return cashRepository.listMovements(database, filters)
  }

  const listCashCuts = async (filters: { cashRegisterId?: string; userId?: string; limit?: number; offset?: number } = {}): Promise<CashCut[]> => {
    const database = await ensureDatabase()
    return cashRepository.listCuts(database, filters)
  }

  const openCashRegister = async (input: CashRegisterInput): Promise<CashRegister> => {
    const database = await ensureDatabase()
    const opened = await cashRepository.open(database, input)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Caja abierta')
    return opened
  }

  const closeCashRegister = async (cashRegisterId: string, closingAmount: number, observations: string | null = null): Promise<CashRegister> => {
    const database = await ensureDatabase()
    const closed = await cashRepository.close(database, cashRegisterId, closingAmount, observations)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Caja cerrada')
    return closed
  }

  const registerCashMovement = async (input: CashMovementInput): Promise<CashMovement> => {
    const database = await ensureDatabase()
    const movement = await cashRepository.registerMovement(database, input)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Movimiento de caja registrado')
    return movement
  }

  const registerCashCut = async (input: CashCutInput): Promise<CashCut> => {
    const database = await ensureDatabase()
    const cut = await cashRepository.registerCut(database, input)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Corte de caja registrado')
    return cut
  }

  const authenticateInternalUser = async (email: string, password: string): Promise<InternalUser> => {
    const database = await ensureDatabase()
    const row = userRepository.getAuthenticationRow(database, email)

    if (!row) {
      throw new Error('Usuario no encontrado')
    }

    const isValid = await verifyPassword(password, String(row.password_salt), String(row.password_hash))

    if (!isValid) {
      throw new Error('Contraseña incorrecta')
    }

    if (!row.last_login_at) {
      row.must_change_password = 1
    }

    await userRepository.recordLogin(database, String(row.id))

    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Login interno exitoso')
    return mapUser(row)
  }

  const saveInternalUser = async (user: InternalUser, password: string): Promise<void> => {
    const database = await ensureDatabase()
    const passwordData = await hashPassword(password)
    await userRepository.save(database, user, passwordData)

    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Usuario guardado')
  }

  const changeUserPassword = async (userId: string, password: string, mustChangePassword = false): Promise<void> => {
    const database = await ensureDatabase()
    const passwordData = await hashPassword(password)
    await userRepository.changePassword(database, userId, passwordData, mustChangePassword)

    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Contraseña actualizada')
  }

  const setUserMustChangePassword = async (userId: string, mustChangePassword: boolean): Promise<void> => {
    const database = await ensureDatabase()
    await userRepository.updateMustChangePassword(database, userId, mustChangePassword)
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Estado de cambio de contraseña actualizado')
  }

  const updateSyncState = async (input: SyncStateInput): Promise<void> => {
    const database = await ensureDatabase()
    await syncRepository.updateSyncState(database, input)
    snapshot = { lastSavedAt: input.localModifiedAt, checksum: snapshot.checksum }
    await persistDatabase(input.source, input.remoteModifiedAt, input.conflictResolution, input.detail)
  }

  const transaction = async <T>(action: (database: SqlJsDatabase) => Promise<T> | T): Promise<T> => {
    const database = await ensureDatabase()
    const result = await withTransaction(database, () => action(database))
    await persistDatabase('local', snapshot.lastSavedAt, 'none', 'Transacción aplicada')
    return result
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
    listCategories,
    findCategoryById,
    saveCategory,
    deleteCategory,
    listProducts,
    searchProducts,
    findProductById,
    findProductByBarcode,
    saveProduct,
    deleteProduct,
    updateProductStock,
    listExtras,
    findExtraById,
    saveExtra,
    deleteExtra,
    listExtrasByProduct,
    setProductExtras,
    findSaleById,
    listSaleDetails,
    listSalePayments,
    listSales,
    createSale,
    updateSale,
    cancelSale,
    findOpenCashRegisterByUser,
    openCashRegister,
    closeCashRegister,
    registerCashMovement,
    registerCashCut,
    listCashRegisters,
    listCashMovements,
    listCashCuts,
  }
}

export const DatabaseServiceImpl = createDatabaseService()

declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: new (data?: ArrayBuffer | Uint8Array) => Database
  }

  export interface Statement {
    bind(values?: ReadonlyArray<string | number | null>): void
    step(): boolean
    getAsObject(): Record<string, unknown>
    free(): void
  }

  export interface Database {
    run(sql: string, params?: ReadonlyArray<string | number | null>): void
    prepare(sql: string): Statement
    export(): Uint8Array
    close(): void
  }

  const initSqlJs: (config?: { locateFile?: (file: string) => string }) => Promise<SqlJsStatic>

  export default initSqlJs
}

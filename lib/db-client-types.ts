/**
 * 数据库客户端类型定义
 * 
 * 支持多种数据库客户端：
 * - PostgreSQL (pg)
 * - Supabase (通过 rpc 或 query)
 */

export interface DatabaseQueryResult {
  rows: Array<Record<string, unknown>>
  rowCount?: number
}

export interface DatabaseClient {
  query(
    text: string,
    params?: unknown[]
  ): Promise<DatabaseQueryResult>
}


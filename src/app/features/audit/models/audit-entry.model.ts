export type AuditMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'
export type AuditEntity = 'vehicle' | 'brand' | 'model' | 'operation' | 'auth'

export interface AuditEntry {
  id: string
  timestamp: string
  user: string
  method: AuditMethod
  endpoint: string
  entity: AuditEntity
  entity_id?: string
  response_status: number
  payload?: {
    before?: Record<string, unknown>
    after?: Record<string, unknown>
  }
  ip?: string
}

export interface AuditFilters {
  user?: string
  method?: AuditMethod
  entity?: AuditEntity
  date_from?: string
  date_to?: string
  page: number
  page_size: number
}

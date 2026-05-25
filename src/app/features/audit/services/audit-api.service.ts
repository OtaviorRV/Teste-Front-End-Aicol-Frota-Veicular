import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, map } from 'rxjs'
import { environment } from '../../../../environments/environment'
import { PaginatedResponse } from '../../../shared/models/api.models'
import { AuditEntry, AuditFilters } from '../models/audit-entry.model'

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private readonly http = inject(HttpClient)
  private readonly base = `${environment.apiUrl}/audit`

  getAll(filters: AuditFilters): Observable<PaginatedResponse<AuditEntry>> {
    if (environment.useMock) {
      return this.http
        .get<AuditEntry[]>('/assets/mocks/seed_audit.json')
        .pipe(map(data => this.applyMockFilters(data, filters)))
    }

    const params = Object.fromEntries(
      Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)])
    )
    return this.http.get<PaginatedResponse<AuditEntry>>(this.base, { params })
  }

  private applyMockFilters(all: AuditEntry[], filters: AuditFilters): PaginatedResponse<AuditEntry> {
    let result = [...all]

    if (filters.user) {
      const user = filters.user.toLowerCase()
      result = result.filter(e => e.user.toLowerCase().includes(user))
    }
    if (filters.method) {
      result = result.filter(e => e.method === filters.method)
    }
    if (filters.entity) {
      result = result.filter(e => e.entity === filters.entity)
    }
    if (filters.date_from) {
      result = result.filter(e => e.timestamp >= filters.date_from!)
    }
    if (filters.date_to) {
      result = result.filter(e => e.timestamp <= filters.date_to!)
    }

    const total = result.length
    const start = (filters.page - 1) * filters.page_size

    return { data: result.slice(start, start + filters.page_size), total }
  }
}

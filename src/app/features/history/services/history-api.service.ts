import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, delay, map, of } from 'rxjs'
import { environment } from '../../../../environments/environment'
import {
  CreateOperationDto,
  OperationType,
  PaginatedOperationResponse,
  VehicleOperation,
  VehicleOperationFilters,
} from '../models/history.models'

@Injectable({ providedIn: 'root' })
export class HistoryApiService {
  private readonly http = inject(HttpClient)
  private readonly baseUrl = `${environment.apiUrl}/operations`

  getAll(filters?: VehicleOperationFilters): Observable<PaginatedOperationResponse> {
    if (environment.useMock) {
      return this.http
        .get<{ operations: VehicleOperation[] }>('/assets/mocks/seed_vehicles.json')
        .pipe(map(data => this.applyMockFilters(data.operations ?? [], filters)))
    }

    const params = Object.fromEntries(
      Object.entries(filters ?? {})
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)])
    )
    return this.http.get<PaginatedOperationResponse>(this.baseUrl, { params })
  }

  create(dto: CreateOperationDto): Observable<VehicleOperation> {
    if (environment.useMock) {
      const mock: VehicleOperation = {
        ...dto,
        id: crypto.randomUUID(),
        vehicle_plate: 'XXX0000',
        performed_by: dto.created_by,
        created_at: new Date().toISOString(),
      }
      return of(mock).pipe(delay(400))
    }
    return this.http.post<VehicleOperation>(this.baseUrl, dto)
  }

  private applyMockFilters(
    all: VehicleOperation[],
    filters?: VehicleOperationFilters
  ): PaginatedOperationResponse {
    let result = [...all]

    if (filters?.vehicle_plate) {
      const plate = filters.vehicle_plate.toLowerCase()
      result = result.filter(op => op.vehicle_plate.toLowerCase().includes(plate))
    }
    if (filters?.type) {
      result = result.filter(op => op.type === (filters.type as OperationType))
    }
    if (filters?.date_from) {
      result = result.filter(op => op.created_at >= filters.date_from!)
    }
    if (filters?.date_to) {
      result = result.filter(op => op.created_at <= filters.date_to!)
    }

    const total = result.length
    const page = filters?.page ?? 1
    const pageSize = filters?.page_size ?? 10
    const start = (page - 1) * pageSize

    return { data: result.slice(start, start + pageSize), total }
  }
}

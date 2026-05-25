import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, delay, map, of, switchMap, tap } from 'rxjs'
import { environment } from '../../../../environments/environment'
import { VehicleApiService } from '../../vehicles/services/vehicle-api.service'
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
  private readonly vehicleApi = inject(VehicleApiService)
  private readonly baseUrl = `${environment.apiUrl}/operations`

  private mockCache: VehicleOperation[] | null = null

  private ensureLoaded(): Observable<VehicleOperation[]> {
    if (this.mockCache !== null) return of(this.mockCache)
    return this.http.get<VehicleOperation[]>('/assets/mocks/seed_operations.json').pipe(
      tap(data => this.mockCache = [...data]),
      map(() => this.mockCache!)
    )
  }

  getAll(filters?: VehicleOperationFilters): Observable<PaginatedOperationResponse> {
    if (environment.useMock) {
      return this.ensureLoaded().pipe(
        map(data => this.applyMockFilters(data, filters))
      )
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
      return this.vehicleApi.getById(dto.vehicle_id).pipe(
        switchMap(vehicle => this.ensureLoaded().pipe(
          map(() => {
            const op: VehicleOperation = {
              id: crypto.randomUUID(),
              vehicle_id: dto.vehicle_id,
              vehicle_plate: vehicle.license_plate,
              type: dto.type,
              notes: dto.notes,
              odometer_km: dto.odometer_km,
              expected_return_date: dto.expected_return_date,
              performed_by: dto.created_by,
              created_at: new Date().toISOString(),
            }
            this.mockCache = [op, ...this.mockCache!]
            return op
          })
        )),
        delay(400)
      )
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

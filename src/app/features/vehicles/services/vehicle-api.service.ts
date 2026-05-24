import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, map, of, switchMap } from 'rxjs'
import { environment } from '../../../../environments/environment'
import { Vehicle, VehicleFilters } from '../models/vehicle.model'
import { CreateVehicleDto, UpdateVehicleDto } from '../models/vehicle-dto.models'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
}

@Injectable({ providedIn: 'root' })
export class VehicleApiService {
  private readonly http = inject(HttpClient)
  private readonly base = `${environment.apiUrl}/vehicles`

  getAll(filters: VehicleFilters): Observable<PaginatedResponse<Vehicle>> {
    if (environment.useMock) {
      return this.http.get<Vehicle[]>('/assets/mocks/seed_vehicles.json').pipe(
        map(all => this.applyMockFilters(all, filters))
      )
    }
    const params = this.buildParams(filters)
    return this.http.get<PaginatedResponse<Vehicle>>(this.base, { params })
  }

  getById(id: string): Observable<Vehicle> {
    if (environment.useMock) {
      return this.http.get<Vehicle[]>('/assets/mocks/seed_vehicles.json').pipe(
        map(all => {
          const found = all.find(v => v.id === id)
          if (!found) throw new Error(`Vehicle ${id} not found`)
          return found
        })
      )
    }
    return this.http.get<Vehicle>(`${this.base}/${id}`)
  }

  create(dto: CreateVehicleDto): Observable<Vehicle> {
    if (environment.useMock) {
      const created: Vehicle = {
        id: `veh-${Date.now()}`,
        license_plate: dto.license_plate,
        chassis: dto.chassis,
        renavam: dto.renavam,
        year: dto.year,
        model_id: dto.model_id,
        status: 'disponivel',
        created_at: new Date().toISOString(),
        created_by: dto.created_by,
      }
      return of(created)
    }
    return this.http.post<Vehicle>(this.base, dto)
  }

  update(id: string, dto: UpdateVehicleDto): Observable<Vehicle> {
    if (environment.useMock) {
      return this.getById(id).pipe(
        map(existing => ({ ...existing, ...dto }))
      )
    }
    return this.http.patch<Vehicle>(`${this.base}/${id}`, dto)
  }

  remove(id: string): Observable<void> {
    if (environment.useMock) {
      return of(undefined)
    }
    return this.http.delete<void>(`${this.base}/${id}`)
  }

  checkFieldExists(field: 'license_plate' | 'chassis' | 'renavam', value: string, excludeId?: string): Observable<boolean> {
    if (environment.useMock) {
      return this.http.get<Vehicle[]>('/assets/mocks/seed_vehicles.json').pipe(
        map(all => all.some(v => v[field] === value && v.id !== excludeId))
      )
    }
    const params = this.buildParams({ [field]: value, exclude_id: excludeId })
    return this.http.get<{ exists: boolean }>(`${this.base}/check-field`, { params }).pipe(
      map(r => r.exists)
    )
  }

  countByModel(modelId: string): Observable<number> {
    if (environment.useMock) {
      return this.http.get<Vehicle[]>('/assets/mocks/seed_vehicles.json').pipe(
        map(all => all.filter(v => v.model_id === modelId).length)
      )
    }
    return this.http.get<{ count: number }>(`${this.base}/count-by-model/${modelId}`).pipe(
      map(r => r.count)
    )
  }

  private applyMockFilters(all: Vehicle[], filters: VehicleFilters): PaginatedResponse<Vehicle> {
    let result = [...all]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(v =>
        v.license_plate.toLowerCase().includes(q) ||
        v.brand_name?.toLowerCase().includes(q) ||
        v.model_name?.toLowerCase().includes(q)
      )
    }

    if (filters.status) {
      result = result.filter(v => v.status === filters.status)
    }

    if (filters.brand_id) {
      result = result.filter(v => (v as Vehicle & { brand_id?: string }).brand_id === filters.brand_id || v.brand_name)
    }

    if (filters.year) {
      result = result.filter(v => v.year === filters.year)
    }

    const total = result.length
    const start = (filters.page - 1) * filters.page_size
    const data = result.slice(start, start + filters.page_size)

    return { data, total }
  }

  private buildParams(obj: object): HttpParams {
    let params = new HttpParams()
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value))
      }
    }
    return params
  }
}

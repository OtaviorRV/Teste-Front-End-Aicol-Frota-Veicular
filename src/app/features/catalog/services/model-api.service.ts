import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { map, Observable, of, tap } from 'rxjs'
import { delay } from 'rxjs/operators'
import { environment } from '../../../../environments/environment'
import { VehicleModel, CreateModelDto, UpdateModelDto } from '../models/catalog.models'

@Injectable({ providedIn: 'root' })
export class ModelApiService {
  private readonly http = inject(HttpClient)
  private readonly baseUrl = `${environment.apiUrl}/models`

  private mockCache: VehicleModel[] | null = null

  private ensureLoaded(): Observable<VehicleModel[]> {
    if (this.mockCache !== null) return of(this.mockCache)
    return this.http.get<VehicleModel[]>('/assets/mocks/seed_models.json').pipe(
      tap(data => this.mockCache = [...data]),
      map(() => this.mockCache!)
    )
  }

  getAll(): Observable<VehicleModel[]> {
    if (environment.useMock) {
      return this.ensureLoaded().pipe(map(d => [...d]))
    }
    return this.http.get<VehicleModel[]>(this.baseUrl)
  }

  getById(id: string): Observable<VehicleModel> {
    if (environment.useMock) {
      return this.ensureLoaded().pipe(
        map(models => {
          const found = models.find(m => m.id === id)
          if (!found) throw new Error(`Model ${id} not found`)
          return found
        })
      )
    }
    return this.http.get<VehicleModel>(`${this.baseUrl}/${id}`)
  }

  create(dto: CreateModelDto): Observable<VehicleModel> {
    if (environment.useMock) {
      return this.ensureLoaded().pipe(
        map(() => {
          const model: VehicleModel = {
            ...dto,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          }
          this.mockCache = [model, ...this.mockCache!]
          return model
        }),
        delay(300)
      )
    }
    return this.http.post<VehicleModel>(this.baseUrl, dto)
  }

  update(id: string, dto: UpdateModelDto): Observable<VehicleModel> {
    if (environment.useMock) {
      return this.ensureLoaded().pipe(
        map(() => {
          const idx = this.mockCache!.findIndex(m => m.id === id)
          if (idx === -1) throw new Error(`Model ${id} not found`)
          const updated = { ...this.mockCache![idx], ...dto }
          this.mockCache![idx] = updated
          return updated
        }),
        delay(300)
      )
    }
    return this.http.patch<VehicleModel>(`${this.baseUrl}/${id}`, dto)
  }

  remove(id: string): Observable<void> {
    if (environment.useMock) {
      return this.ensureLoaded().pipe(
        map(() => {
          this.mockCache = this.mockCache!.filter(m => m.id !== id)
        }),
        delay(200)
      )
    }
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
  }

  checkNameExists(name: string, brandId: string, excludeId?: undefined | string): Observable<boolean> {
    if (environment.useMock) {
      return this.ensureLoaded().pipe(
        map(models =>
          models.some(
            m =>
              m.name.toLowerCase() === name.toLowerCase() &&
              m.brand_id === brandId &&
              m.id !== excludeId
          )
        )
      )
    }
    const params: Record<string, string> = { name, brand_id: brandId }
    if (excludeId) params['exclude_id'] = excludeId
    return this.http
      .get<{ exists: boolean }>(`${this.baseUrl}/check`, { params })
      .pipe(map(r => r.exists))
  }
}

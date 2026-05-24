import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { map, Observable, of } from 'rxjs'
import { delay } from 'rxjs/operators'
import { environment } from '../../../../environments/environment'
import { Brand, CreateBrandDto, UpdateBrandDto } from '../models/catalog.models'

@Injectable({ providedIn: 'root' })
export class BrandApiService {
  private readonly http = inject(HttpClient)
  private readonly baseUrl = `${environment.apiUrl}/brands`

  getAll(): Observable<Brand[]> {
    if (environment.useMock) {
      return this.http.get<Brand[]>('/assets/mocks/seed_brands.json')
    }
    return this.http.get<Brand[]>(this.baseUrl)
  }

  getById(id: string): Observable<Brand> {
    if (environment.useMock) {
      return this.getAll().pipe(
        map(brands => {
          const found = brands.find(b => b.id === id)
          if (!found) throw new Error(`Brand ${id} not found`)
          return found
        })
      )
    }
    return this.http.get<Brand>(`${this.baseUrl}/${id}`)
  }

  create(dto: CreateBrandDto): Observable<Brand> {
    if (environment.useMock) {
      return of({
        ...dto,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }).pipe(delay(300))
    }
    return this.http.post<Brand>(this.baseUrl, dto)
  }

  update(id: string, dto: UpdateBrandDto): Observable<Brand> {
    if (environment.useMock) {
      return this.getById(id).pipe(
        map(existing => ({ ...existing, ...dto })),
        delay(300)
      )
    }
    return this.http.patch<Brand>(`${this.baseUrl}/${id}`, dto)
  }

  remove(id: string): Observable<void> {
    if (environment.useMock) {
      return of(undefined).pipe(delay(200))
    }
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
  }

  checkNameExists(name: string, excludeId?: string): Observable<boolean> {
    if (environment.useMock) {
      return this.getAll().pipe(
        map(brands =>
          brands.some(
            b => b.name.toLowerCase() === name.toLowerCase() && b.id !== excludeId
          )
        )
      )
    }
    const params: Record<string, string> = { name }
    if (excludeId) params['exclude_id'] = excludeId
    return this.http
      .get<{ exists: boolean }>(`${this.baseUrl}/check`, { params })
      .pipe(map(r => r.exists))
  }
}

import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { Brand, CreateBrandDto, UpdateBrandDto } from '../models/catalog.models'

@Injectable({ providedIn: 'root' })
export class BrandApiService {
  getAll(): Observable<Brand[]> { return of([]) }
  getById(id: string): Observable<Brand> { return of({ id, name: '', created_at: '', created_by: '' }) }
  create(_dto: CreateBrandDto): Observable<Brand> { return of({} as Brand) }
  update(_id: string, _dto: UpdateBrandDto): Observable<Brand> { return of({} as Brand) }
  remove(_id: string): Observable<void> { return of(undefined) }
}

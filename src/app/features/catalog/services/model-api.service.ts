import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { VehicleModel, CreateModelDto, UpdateModelDto } from '../models/catalog.models'

@Injectable({ providedIn: 'root' })
export class ModelApiService {
  getAll(): Observable<VehicleModel[]> { return of([]) }
  getById(id: string): Observable<VehicleModel> { return of({ id, name: '', brand_id: '', created_at: '', created_by: '' }) }
  create(_dto: CreateModelDto): Observable<VehicleModel> { return of({} as VehicleModel) }
  update(_id: string, _dto: UpdateModelDto): Observable<VehicleModel> { return of({} as VehicleModel) }
  remove(_id: string): Observable<void> { return of(undefined) }
}

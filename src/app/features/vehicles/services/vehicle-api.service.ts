import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { Vehicle, VehicleFilters } from '../models/vehicle.model'
import { CreateVehicleDto, UpdateVehicleDto } from '../models/vehicle-dto.models'

export interface VehicleListResponse {
  data: Vehicle[]
  total: number
}

@Injectable({ providedIn: 'root' })
export class VehicleApiService {
  getAll(_filters: VehicleFilters): Observable<VehicleListResponse> {
    return of({ data: [], total: 0 })
  }

  create(_dto: CreateVehicleDto): Observable<Vehicle> {
    return of({} as Vehicle)
  }

  update(_id: string, _dto: UpdateVehicleDto): Observable<Vehicle> {
    return of({} as Vehicle)
  }

  remove(_id: string): Observable<void> {
    return of(undefined)
  }
}

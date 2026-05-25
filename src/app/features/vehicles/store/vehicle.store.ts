import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { EMPTY, Observable, Subject } from 'rxjs'
import { catchError, switchMap, tap } from 'rxjs/operators'
import { OperationType, Vehicle, VehicleFilters, VehicleStatusEvent } from '../models/vehicle.model'
import { CreateVehicleDto, UpdateVehicleDto } from '../models/vehicle-dto.models'
import { VehicleApiService } from '../services/vehicle-api.service'
import { NEXT_STATUS } from '../utils/vehicle.utils'

@Injectable({ providedIn: 'root' })
export class VehicleStore {
  private readonly vehicleApi = inject(VehicleApiService)
  private readonly destroyRef = inject(DestroyRef)

  readonly vehicles = signal<Vehicle[]>([])
  readonly total = signal(0)
  readonly loading = signal(false)
  readonly loadError = signal(false)
  readonly filters = signal<VehicleFilters>({ page: 1, page_size: 10 })
  readonly selectedVehicle = signal<Vehicle | null>(null)

  readonly isEmpty = computed(() =>
    !this.loading() && !this.loadError() && this.vehicles().length === 0
  )
  readonly hasActiveFilters = computed(() =>
    !!(this.filters().search || this.filters().status ||
       this.filters().brand_id || this.filters().year)
  )
  readonly filteredCount = computed(() => this.total())

  private readonly loadTrigger$ = new Subject<void>()

  constructor() {
    this.loadTrigger$.pipe(
      switchMap(() =>
        this.vehicleApi.getAll(this.filters()).pipe(
          catchError(() => {
            this.loadError.set(true)
            this.loading.set(false)
            return EMPTY
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ data, total }) => {
      this.vehicles.set(data)
      this.total.set(total)
      this.loading.set(false)
    })
  }

  loadVehicles(): void {
    this.loading.set(true)
    this.loadError.set(false)
    this.loadTrigger$.next()
  }

  applyFilter(partial: Partial<VehicleFilters>): void {
    this.filters.update(f => ({ ...f, ...partial, page: 1 }))
    this.loadVehicles()
  }

  resetFilters(): void {
    this.filters.set({ page: 1, page_size: 10 })
    this.loadVehicles()
  }

  setPage(page: number): void {
    this.filters.update(f => ({ ...f, page }))
    this.loadVehicles()
  }

  setPageSize(size: number): void {
    this.filters.update(f => ({ ...f, page_size: size, page: 1 }))
    this.loadVehicles()
  }

  setSelectedVehicle(v: Vehicle | null): void {
    this.selectedVehicle.set(v)
  }

  createVehicle(dto: CreateVehicleDto): Observable<Vehicle> {
    return this.vehicleApi.create(dto).pipe(
      tap(created => {
        this.vehicles.update(list => [created, ...list])
        this.total.update(t => t + 1)
      })
    )
  }

  updateVehicle(id: string, dto: UpdateVehicleDto): Observable<Vehicle> {
    return this.vehicleApi.update(id, dto).pipe(
      tap(updated => {
        this.vehicles.update(list => list.map(v => v.id === id ? updated : v))
        this.setSelectedVehicle(updated)
      })
    )
  }

  deleteVehicle(id: string): Observable<void> {
    return this.vehicleApi.remove(id).pipe(
      tap(() => {
        this.vehicles.update(list => list.filter(v => v.id !== id))
        this.total.update(t => t - 1)
        const isEmpty = this.vehicles().length === 0
        const isNotFirstPage = this.filters().page > 1
        if (isEmpty && isNotFirstPage) {
          this.filters.update(f => ({ ...f, page: f.page - 1 }))
          this.loadVehicles()
        }
      })
    )
  }

  registerOperation(dto: {
    vehicleId: string
    type: OperationType
    odometerKm?: number | null
    expectedReturnDate?: string | null
    notes?: string | null
  }): void {
    const newStatus = NEXT_STATUS[dto.type]
    this.vehicles.update(list =>
      list.map(v => v.id === dto.vehicleId ? {
        ...v,
        status: newStatus,
        operation_count: (v.operation_count ?? 0) + 1,
        last_odometer_km: dto.odometerKm != null ? dto.odometerKm : v.last_odometer_km,
      } : v)
    )
  }

  applyRealtimeUpdate(event: VehicleStatusEvent): void {
    this.vehicles.update(list =>
      list.map(v => v.id === event.vehicle_id ? { ...v, status: event.new_status } : v)
    )
  }
}

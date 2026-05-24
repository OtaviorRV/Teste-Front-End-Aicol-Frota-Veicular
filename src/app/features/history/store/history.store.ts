import { Injectable, computed, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { DestroyRef } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { HistoryApiService } from '../services/history-api.service'
import {
  CreateOperationDto,
  VehicleOperation,
  VehicleOperationFilters,
} from '../models/history.models'

@Injectable()
export class HistoryStore {
  private readonly api = inject(HistoryApiService)
  private readonly destroyRef = inject(DestroyRef)

  readonly operations = signal<VehicleOperation[]>([])
  readonly total = signal(0)
  readonly loading = signal(false)
  readonly filters = signal<VehicleOperationFilters>({ page: 1, page_size: 10 })

  readonly isEmpty = computed(() => this.operations().length === 0)
  readonly hasActiveFilters = computed(() =>
    !!this.filters().type ||
    !!this.filters().vehicle_plate ||
    !!this.filters().date_from ||
    !!this.filters().date_to
  )

  loadOperations(filters?: Partial<VehicleOperationFilters>): void {
    if (filters) this.filters.update(f => ({ ...f, ...filters }))
    this.loading.set(true)
    this.api
      .getAll(this.filters())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data, total }) => {
          this.operations.set(data)
          this.total.set(total)
          this.loading.set(false)
        },
        error: () => this.loading.set(false),
      })
  }

  applyFilter(partial: Partial<VehicleOperationFilters>): void {
    this.filters.update(f => ({ ...f, ...partial, page: 1 }))
    this.loadOperations()
  }

  registerOperation(dto: CreateOperationDto): Observable<VehicleOperation> {
    return this.api.create(dto).pipe(
      tap(op => {
        this.operations.update(list => [op, ...list])
        this.total.update(t => t + 1)
      })
    )
  }
}

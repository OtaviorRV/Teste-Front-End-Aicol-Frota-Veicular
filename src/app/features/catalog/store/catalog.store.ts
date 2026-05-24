import { computed, Injectable, signal, DestroyRef, inject } from '@angular/core'
import { forkJoin, Observable, tap } from 'rxjs'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { BrandApiService } from '../services/brand-api.service'
import { ModelApiService } from '../services/model-api.service'
import {
  Brand,
  VehicleModel,
  CreateBrandDto,
  UpdateBrandDto,
  CreateModelDto,
  UpdateModelDto,
} from '../models/catalog.models'

export type { Brand, VehicleModel }

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly brandApi = inject(BrandApiService)
  private readonly modelApi = inject(ModelApiService)
  private readonly destroyRef = inject(DestroyRef)

  readonly brands = signal<Brand[]>([])
  readonly models = signal<VehicleModel[]>([])
  readonly loaded = signal(false)
  readonly loading = signal(false)

  readonly modelCountByBrand = computed(() =>
    this.models().reduce((acc, m) => {
      acc.set(m.brand_id, (acc.get(m.brand_id) ?? 0) + 1)
      return acc
    }, new Map<string, number>())
  )

  loadIfEmpty(): void {
    if (this.loaded()) return
    this.loadBrandsAndModels()
  }

  reload(): void {
    this.loaded.set(false)
    this.loadBrandsAndModels()
  }

  private loadBrandsAndModels(): void {
    this.loading.set(true)
    forkJoin({
      brands: this.brandApi.getAll(),
      models: this.modelApi.getAll(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ brands, models }) => {
          this.brands.set(brands)
          this.models.set(models)
          this.loaded.set(true)
          this.loading.set(false)
        },
        error: () => {
          this.loading.set(false)
        },
      })
  }

  createBrand(dto: CreateBrandDto): Observable<Brand> {
    return this.brandApi.create(dto).pipe(tap(() => this.reload()))
  }

  updateBrand(id: string, dto: UpdateBrandDto): Observable<Brand> {
    return this.brandApi.update(id, dto).pipe(tap(() => this.reload()))
  }

  deleteBrand(id: string): Observable<void> {
    return this.brandApi.remove(id).pipe(tap(() => this.reload()))
  }

  createModel(dto: CreateModelDto): Observable<VehicleModel> {
    return this.modelApi.create(dto).pipe(tap(() => this.reload()))
  }

  updateModel(id: string, dto: UpdateModelDto): Observable<VehicleModel> {
    return this.modelApi.update(id, dto).pipe(tap(() => this.reload()))
  }

  deleteModel(id: string): Observable<void> {
    return this.modelApi.remove(id).pipe(tap(() => this.reload()))
  }
}

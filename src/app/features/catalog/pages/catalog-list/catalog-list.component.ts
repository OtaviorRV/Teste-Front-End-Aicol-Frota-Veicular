import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  OnInit,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
import { forkJoin } from 'rxjs'
import { filter, finalize, first, map, take } from 'rxjs/operators'

import { CatalogStore } from '../../store/catalog.store'
import { Brand, VehicleModel } from '../../models/catalog.models'
import { VehicleApiService } from '../../../vehicles/services/vehicle-api.service'
import { DialogService } from '../../../../core/dialog/dialog.service'
import { ToastService } from '../../../../core/toast/toast.service'
import { canDeleteBrand, canDeleteModel } from '../../utils/catalog.utils'
import { DataTableComponent } from '../../../../shared/components/molecules/data-table/data-table.component'
import { BadgeComponent } from '../../../../shared/components/atoms/badge/badge.component'
import { TableColumn } from '../../../../shared/components/molecules/data-table/table-column.model'
import { BrandFormComponent, BrandFormData } from './brand-form.component'
import { ModelFormComponent, ModelFormData } from './model-form.component'

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, BadgeComponent, RouterLink],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1 class="page-title">Catálogo</h1>
          <p class="page-subtitle">Marcas e modelos disponíveis para cadastro de veículos.</p>
        </div>
        <button
          type="button"
          class="btn primary"
          [disabled]="entity() === 'models' && catalogStore.brands().length === 0"
          (click)="openForm()"
        >
          + {{ entity() === 'brands' ? 'Nova marca' : 'Novo modelo' }}
        </button>
      </div>

      <div class="tabs">
        <a class="tab" [class.active]="entity() === 'brands'" routerLink="/catalog/brands">Marcas</a>
        <a class="tab" [class.active]="entity() === 'models'" routerLink="/catalog/models">Modelos</a>
      </div>

      <div class="card">

        @if (entity() === 'brands') {
          <div class="toolbar">
            <div class="left">
              <div class="search">
                <div class="input-group">
                  <svg xmlns="http://www.w3.org/2000/svg" class="leading-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar marca…"
                    class="input"
                    [value]="brandSearch()"
                    (input)="setBrandSearch($any($event.target).value)"
                  />
                </div>
              </div>
            </div>
            <div class="right" style="font-size:12.5px;color:var(--text-muted)">
              {{ filteredBrands().length }} marca(s) · {{ catalogStore.models().length }} modelo(s)
            </div>
          </div>

          <app-data-table
            [rows]="pagedBrands()"
            [columns]="brandColumns()"
            [loading]="catalogStore.loading()"
            [emptyTemplate]="brandEmptyTpl"
            [noBorder]="true"
          />

          @if (filteredBrands().length > 0) {
            <div class="pagination">
              <span>Exibindo <strong>{{ brandRangeStart() }}–{{ brandRangeEnd() }}</strong> de <strong>{{ filteredBrands().length }}</strong></span>
              <div class="controls">
                <div class="select-wrap" style="width: auto">
                  <select
                    class="select"
                    style="width: auto; height: 26px; font-size: 12px; padding: 0 26px 0 8px"
                    [value]="brandPageSize()"
                    (change)="onBrandPageSizeChange(+$any($event.target).value)"
                  >
                    <option value="10">10 / pág</option>
                    <option value="20">20 / pág</option>
                    <option value="50">50 / pág</option>
                  </select>
                </div>
                <button
                  type="button"
                  class="btn icon"
                  [disabled]="brandPage() <= 1"
                  (click)="prevBrandPage()"
                  aria-label="Página anterior"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </button>
                <span style="font-size: 12.5px; color: var(--text-muted); min-width: 52px; text-align: center">
                  {{ brandPage() }} / {{ brandTotalPages() }}
                </span>
                <button
                  type="button"
                  class="btn icon"
                  [disabled]="brandPage() >= brandTotalPages()"
                  (click)="nextBrandPage()"
                  aria-label="Próxima página"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        } @else {
          <div class="toolbar">
            <div class="left">
              <div class="search">
                <div class="input-group">
                  <svg xmlns="http://www.w3.org/2000/svg" class="leading-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar modelo…"
                    class="input"
                    [value]="modelSearch()"
                    (input)="setModelSearch($any($event.target).value)"
                  />
                </div>
              </div>
              <div class="select-wrap" style="width:180px">
                <select class="select" [value]="modelBrandFilter()" (change)="setModelBrandFilter($any($event.target).value)">
                  <option value="">Todas as marcas</option>
                  @for (b of catalogStore.brands(); track b.id) {
                    <option [value]="b.id">{{ b.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="right" style="font-size:12.5px;color:var(--text-muted)">
              {{ filteredModels().length }} modelo(s)
            </div>
          </div>

          <app-data-table
            [rows]="pagedModels()"
            [columns]="modelColumns()"
            [loading]="catalogStore.loading()"
            [emptyTemplate]="modelEmptyTpl"
            [noBorder]="true"
          />

          @if (filteredModels().length > 0) {
            <div class="pagination">
              <span>Exibindo <strong>{{ modelRangeStart() }}–{{ modelRangeEnd() }}</strong> de <strong>{{ filteredModels().length }}</strong></span>
              <div class="controls">
                <div class="select-wrap" style="width: auto">
                  <select
                    class="select"
                    style="width: auto; height: 26px; font-size: 12px; padding: 0 26px 0 8px"
                    [value]="modelPageSize()"
                    (change)="onModelPageSizeChange(+$any($event.target).value)"
                  >
                    <option value="10">10 / pág</option>
                    <option value="20">20 / pág</option>
                    <option value="50">50 / pág</option>
                  </select>
                </div>
                <button
                  type="button"
                  class="btn icon"
                  [disabled]="modelPage() <= 1"
                  (click)="prevModelPage()"
                  aria-label="Página anterior"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </button>
                <span style="font-size: 12.5px; color: var(--text-muted); min-width: 52px; text-align: center">
                  {{ modelPage() }} / {{ modelTotalPages() }}
                </span>
                <button
                  type="button"
                  class="btn icon"
                  [disabled]="modelPage() >= modelTotalPages()"
                  (click)="nextModelPage()"
                  aria-label="Próxima página"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        }

      </div>
    </div>

    <!-- Marca badge cell (models table) -->
    <ng-template #brandBadgeTpl let-m>
      <app-badge [label]="brandName(m.brand_id)" variant="outline" />
    </ng-template>

    <!-- Brand actions -->
    <ng-template #brandActionsTpl let-brand>
      <div class="cell-actions">
        <button type="button" class="btn icon" title="Editar" (click)="openBrandForm(brand)">
          <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
          </svg>
        </button>
        <button
          type="button"
          class="btn icon"
          [title]="brandModelCount(brand.id) > 0 ? 'Não é possível excluir uma marca com modelos cadastrados (' + brandModelCount(brand.id) + ' modelo(s)).' : ''"
          [attr.aria-disabled]="brandModelCount(brand.id) > 0 ? 'true' : null"
          [style.opacity]="brandModelCount(brand.id) > 0 ? '0.4' : null"
          [style.cursor]="brandModelCount(brand.id) > 0 ? 'not-allowed' : null"
          (click)="deleteBrand(brand)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    </ng-template>

    <!-- Model actions -->
    <ng-template #modelActionsTpl let-model>
      <div class="cell-actions">
        <button type="button" class="btn icon" title="Editar" (click)="openModelForm(model)">
          <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
          </svg>
        </button>
        <button
          type="button"
          class="btn icon"
          [disabled]="deletingId() === model.id"
          [title]="modelVehicleCount(model.id) > 0 ? 'Não é possível excluir um modelo com veículos cadastrados (' + modelVehicleCount(model.id) + ' veículo(s)).' : ''"
          [attr.aria-disabled]="modelVehicleCount(model.id) > 0 ? 'true' : null"
          [style.opacity]="modelVehicleCount(model.id) > 0 || deletingId() === model.id ? '0.4' : null"
          [style.cursor]="modelVehicleCount(model.id) > 0 ? 'not-allowed' : null"
          (click)="deleteModel(model)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    </ng-template>

    <!-- Empty states -->
    <ng-template #brandEmptyTpl>
      <div class="empty">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <div class="title">
          {{ brandSearch() ? 'Nenhuma marca encontrada' : 'Nenhuma marca cadastrada' }}
        </div>
        <p class="desc">
          {{ brandSearch() ? 'Tente outro termo.' : 'Cadastre a primeira marca para começar.' }}
        </p>
        @if (!brandSearch()) {
          <button type="button" class="btn primary" (click)="openBrandForm()">+ Nova marca</button>
        }
      </div>
    </ng-template>

    <ng-template #modelEmptyTpl>
      <div class="empty">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <div class="title">
          {{ modelSearch() || modelBrandFilter() ? 'Nenhum modelo encontrado' : 'Nenhum modelo cadastrado' }}
        </div>
        <p class="desc">
          {{ modelSearch() || modelBrandFilter() ? 'Ajuste os filtros.' : 'Cadastre o primeiro modelo para uma marca.' }}
        </p>
      </div>
    </ng-template>
  `,
})
export class CatalogListComponent implements OnInit, AfterViewInit {
  readonly entity = input<'brands' | 'models'>('brands')

  protected readonly catalogStore = inject(CatalogStore)
  private readonly vehicleApi    = inject(VehicleApiService)
  private readonly dialogService = inject(DialogService)
  private readonly toast         = inject(ToastService)
  private readonly destroyRef    = inject(DestroyRef)
  private readonly injector      = inject(Injector)

  @ViewChild('brandBadgeTpl',   { static: true }) private brandBadgeTpl!: TemplateRef<{ $implicit: VehicleModel }>
  @ViewChild('brandActionsTpl', { static: true }) private brandActionsTpl!: TemplateRef<{ $implicit: Brand }>
  @ViewChild('modelActionsTpl', { static: true }) private modelActionsTpl!: TemplateRef<{ $implicit: VehicleModel }>

  protected readonly brandSearch      = signal('')
  protected readonly modelSearch      = signal('')
  protected readonly modelBrandFilter = signal('')
  protected readonly deletingId       = signal<string | null>(null)

  protected readonly brandPage     = signal(1)
  protected readonly brandPageSize = signal(10)
  protected readonly modelPage     = signal(1)
  protected readonly modelPageSize = signal(10)

  private readonly vehicleCountByModel = signal<Map<string, number>>(new Map())

  protected readonly vehicleCountByBrand = computed(() => {
    const vcMap = this.vehicleCountByModel()
    return this.catalogStore.models().reduce((acc, m) => {
      acc.set(m.brand_id, (acc.get(m.brand_id) ?? 0) + (vcMap.get(m.id) ?? 0))
      return acc
    }, new Map<string, number>())
  })

  protected readonly filteredBrands = computed(() => {
    const q = this.brandSearch().trim().toLowerCase()
    return q
      ? this.catalogStore.brands().filter(b => b.name.toLowerCase().includes(q))
      : this.catalogStore.brands()
  })

  protected readonly pagedBrands = computed(() => {
    const all   = this.filteredBrands()
    const start = (this.brandPage() - 1) * this.brandPageSize()
    return all.slice(start, start + this.brandPageSize())
  })

  protected readonly brandTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredBrands().length / this.brandPageSize()))
  )

  protected readonly brandRangeStart = computed(() =>
    this.filteredBrands().length === 0 ? 0 : (this.brandPage() - 1) * this.brandPageSize() + 1
  )

  protected readonly brandRangeEnd = computed(() =>
    Math.min(this.brandPage() * this.brandPageSize(), this.filteredBrands().length)
  )

  protected readonly filteredModels = computed(() => {
    let models = this.catalogStore.models()
    const bf = this.modelBrandFilter()
    if (bf) models = models.filter(m => m.brand_id === bf)
    const q = this.modelSearch().trim().toLowerCase()
    if (q) models = models.filter(m => m.name.toLowerCase().includes(q))
    return models
  })

  protected readonly pagedModels = computed(() => {
    const all   = this.filteredModels()
    const start = (this.modelPage() - 1) * this.modelPageSize()
    return all.slice(start, start + this.modelPageSize())
  })

  protected readonly modelTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredModels().length / this.modelPageSize()))
  )

  protected readonly modelRangeStart = computed(() =>
    this.filteredModels().length === 0 ? 0 : (this.modelPage() - 1) * this.modelPageSize() + 1
  )

  protected readonly modelRangeEnd = computed(() =>
    Math.min(this.modelPage() * this.modelPageSize(), this.filteredModels().length)
  )

  protected readonly brandColumns = signal<TableColumn<Brand>[]>([])
  protected readonly modelColumns = signal<TableColumn<VehicleModel>[]>([])

  ngOnInit(): void {
    this.catalogStore.loadIfEmpty()
    toObservable(this.catalogStore.loaded, { injector: this.injector })
      .pipe(filter(Boolean), first(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadVehicleCounts())
  }

  ngAfterViewInit(): void {
    this.brandColumns.set([
      { key: 'name',          label: 'Nome',     cellClass: 'fw-500' },
      { key: 'model_count',   label: 'Modelos',  width: '110px', align: 'center',
        render: (r: Brand) => String(this.catalogStore.modelCountByBrand().get(r.id) ?? 0),
        cellClass: 'mono text-sm' },
      { key: 'vehicle_count', label: 'Veículos', width: '110px', align: 'center',
        render: (r: Brand) => String(this.vehicleCountByBrand().get(r.id) ?? 0),
        cellClass: 'mono text-sm' },
      { key: 'created_at',    label: 'Criada em', width: '170px',
        render: r => new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        cellClass: 'text-sm text-muted' },
      { key: 'actions', label: '', width: '110px', align: 'right', action: true, cellTemplate: this.brandActionsTpl },
    ])

    this.modelColumns.set([
      { key: 'name',          label: 'Nome',    cellClass: 'fw-500' },
      { key: 'brand_id',      label: 'Marca',   width: '180px', cellTemplate: this.brandBadgeTpl },
      { key: 'vehicle_count', label: 'Veículos', width: '110px', align: 'center',
        render: (r: VehicleModel) => String(this.vehicleCountByModel().get(r.id) ?? 0),
        cellClass: 'mono text-sm' },
      { key: 'created_at',   label: 'Criado em', width: '170px',
        render: r => new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        cellClass: 'text-sm text-muted' },
      { key: 'actions', label: '', width: '110px', align: 'right', action: true, cellTemplate: this.modelActionsTpl },
    ])
  }

  private loadVehicleCounts(): void {
    const models = this.catalogStore.models()
    if (models.length === 0) return
    forkJoin(
      models.map(m => this.vehicleApi.countByModel(m.id).pipe(map(count => [m.id, count] as [string, number])))
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(entries => {
        this.vehicleCountByModel.set(new Map(entries))
      })
  }

  protected setBrandSearch(value: string): void {
    this.brandSearch.set(value)
    this.brandPage.set(1)
  }

  protected prevBrandPage(): void { this.brandPage.update(p => p - 1) }
  protected nextBrandPage(): void { this.brandPage.update(p => p + 1) }
  protected onBrandPageSizeChange(size: number): void {
    this.brandPageSize.set(size)
    this.brandPage.set(1)
  }

  protected setModelSearch(value: string): void {
    this.modelSearch.set(value)
    this.modelPage.set(1)
  }

  protected setModelBrandFilter(value: string): void {
    this.modelBrandFilter.set(value)
    this.modelPage.set(1)
  }

  protected prevModelPage(): void { this.modelPage.update(p => p - 1) }
  protected nextModelPage(): void { this.modelPage.update(p => p + 1) }
  protected onModelPageSizeChange(size: number): void {
    this.modelPageSize.set(size)
    this.modelPage.set(1)
  }

  protected brandName(brandId: string): string {
    return this.catalogStore.brands().find(b => b.id === brandId)?.name ?? '—'
  }

  protected brandModelCount(brandId: string): number {
    return this.catalogStore.modelCountByBrand().get(brandId) ?? 0
  }

  protected modelVehicleCount(modelId: string): number {
    return this.vehicleCountByModel().get(modelId) ?? 0
  }

  protected openForm(): void {
    if (this.entity() === 'brands') this.openBrandForm()
    else this.openModelForm()
  }

  protected openBrandForm(brand?: Brand): void {
    this.dialogService
      .open<'saved' | undefined, BrandFormData>(BrandFormComponent, {
        data: { brand, mode: brand ? 'edit' : 'create' },
      })
      .closed.pipe(take(1))
      .subscribe(result => {
        if (result === 'saved') this.toast.show('Marca salva com sucesso', 'success')
      })
  }

  protected openModelForm(model?: VehicleModel): void {
    this.dialogService
      .open<'saved' | undefined, ModelFormData>(ModelFormComponent, {
        data: { model, mode: model ? 'edit' : 'create' },
      })
      .closed.pipe(take(1))
      .subscribe(result => {
        if (result === 'saved') this.toast.show('Modelo salvo com sucesso', 'success')
      })
  }

  protected deleteBrand(brand: Brand): void {
    const modelCount = this.catalogStore.modelCountByBrand().get(brand.id) ?? 0
    const guard = canDeleteBrand(brand, modelCount)
    if (!guard.allowed) {
      this.toast.show(guard.reason!, 'warning')
      return
    }
    this.dialogService
      .confirm({
        title: 'Excluir marca',
        message: `Tem certeza que deseja excluir "${brand.name}"? Esta ação não pode ser desfeita.`,
        variant: 'danger',
        confirmLabel: 'Excluir',
      })
      .pipe(take(1))
      .subscribe(confirmed => {
        if (!confirmed) return
        this.catalogStore.deleteBrand(brand.id).subscribe(() =>
          this.toast.show('Marca excluída com sucesso', 'success')
        )
      })
  }

  protected deleteModel(model: VehicleModel): void {
    const vc = this.vehicleCountByModel().get(model.id) ?? 0
    const guard = canDeleteModel(model, vc)
    if (!guard.allowed) {
      this.toast.show(guard.reason!, 'warning')
      return
    }
    this.dialogService
      .confirm({
        title: 'Excluir modelo',
        message: `Tem certeza que deseja excluir "${model.name}"? Esta ação não pode ser desfeita.`,
        variant: 'danger',
        confirmLabel: 'Excluir',
      })
      .pipe(take(1))
      .subscribe(confirmed => {
        if (!confirmed) return
        this.deletingId.set(model.id)
        this.catalogStore.deleteModel(model.id)
          .pipe(finalize(() => this.deletingId.set(null)))
          .subscribe(() => this.toast.show('Modelo excluído com sucesso', 'success'))
      })
  }
}

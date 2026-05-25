import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Router } from '@angular/router'
import { DialogRef } from '@angular/cdk/dialog'
import { Subject } from 'rxjs'
import { debounceTime, take } from 'rxjs/operators'

import { VehicleStore } from '../../store/vehicle.store'
import { CatalogStore } from '../../../catalog/store/catalog.store'
import { DialogService } from '../../../../core/dialog/dialog.service'
import { ToastService } from '../../../../core/toast/toast.service'
import { Vehicle, VehicleStatus } from '../../models/vehicle.model'
import {
  canDeleteVehicle,
  formatKm,
  formatPlate,
  vehicleStatusLabel,
  vehicleStatusVariant,
} from '../../utils/vehicle.utils'
import { TableColumn } from '../../../../shared/components/molecules/data-table/table-column.model'
import { DataTableComponent } from '../../../../shared/components/molecules/data-table/data-table.component'
import { BadgeComponent } from '../../../../shared/components/atoms/badge/badge.component'
import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component'
import {
  OperationDialogComponent,
  OperationDialogData,
} from '../../dialogs/operation-dialog/operation-dialog.component'

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, BadgeComponent, ButtonComponent],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1 class="page-title">Veículos</h1>
          <p class="page-subtitle">{{ counterText() }}</p>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <button
            type="button"
            title="Recarregar"
            (click)="vehicleStore.loadVehicles()"
            class="btn icon"
            aria-label="Recarregar lista"
          >
            <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
          </button>
          <app-button variant="primary" (clicked)="navigateToCreate()">+ Novo Veículo</app-button>
        </div>
      </div>

      <div class="card">

        <div class="toolbar">
          <div class="left">
            <div class="search">
              <div class="input-group">
                <svg xmlns="http://www.w3.org/2000/svg" class="leading-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por placa, modelo, marca ou chassi..."
                  class="input"
                  style="padding-right: 36px"
                  [value]="searchValue()"
                  (input)="onSearchChange($any($event.target).value)"
                />
                @if (searchValue()) {
                  <button
                    type="button"
                    class="btn icon trailing-btn"
                    aria-label="Limpar busca"
                    (click)="clearSearch()"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" style="width:12px;height:12px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                }
              </div>
            </div>
            <div class="select-wrap" style="width: auto">
              <select class="select" style="width: auto" (change)="onStatusChange($any($event.target).value)">
                <option value="">Status</option>
                <option value="disponivel">Disponível</option>
                <option value="em_locacao">Em Locação</option>
                <option value="em_manutencao">Manutenção</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            <div class="select-wrap" style="width: auto">
              <select class="select" style="width: auto" (change)="onBrandChange($any($event.target).value)">
                <option value="">Marca</option>
                @for (brand of catalogStore.brands(); track brand.id) {
                  <option [value]="brand.id">{{ brand.name }}</option>
                }
              </select>
            </div>
            <div class="select-wrap" style="width: auto">
              <select class="select" style="width: auto" (change)="onYearChange($any($event.target).value)">
                <option value="">Ano</option>
                @for (year of yearOptions; track year) {
                  <option [value]="year">{{ year }}</option>
                }
              </select>
            </div>
            @if (vehicleStore.hasActiveFilters()) {
              <button
                type="button"
                class="btn ghost sm"
                (click)="vehicleStore.resetFilters(); resetFilterSelects()"
              >
                Limpar filtros
              </button>
            }
          </div>
        </div>

        @if (vehicleStore.loadError()) {
          <div class="empty">
            <p>Não foi possível carregar os veículos.</p>
            <div style="margin-top: 12px">
              <app-button (clicked)="vehicleStore.loadVehicles()">Tentar novamente</app-button>
            </div>
          </div>
        } @else {
          <app-data-table
            [rows]="vehicleStore.vehicles()"
            [columns]="columns()"
            [loading]="vehicleStore.loading()"
            [emptyTemplate]="emptyTpl"
            [rowClass]="vehicleRowClass"
            [noBorder]="true"
          />
        }

        @if (!vehicleStore.loadError() && vehicleStore.total() > 0) {
          <div class="pagination">
            <span [innerHTML]="rangeText()"></span>
            <div class="controls">
              <div class="select-wrap" style="width: auto">
                <select
                  class="select"
                  style="width: auto; height: 26px; font-size: 12px; padding: 0 26px 0 8px"
                  [value]="vehicleStore.filters().page_size"
                  (change)="onPageSizeChange(+$any($event.target).value)"
                >
                  <option value="10">10 / pág</option>
                  <option value="20">20 / pág</option>
                  <option value="50">50 / pág</option>
                </select>
              </div>
              <button
                type="button"
                class="btn icon"
                [disabled]="vehicleStore.filters().page <= 1"
                (click)="onPageChange(vehicleStore.filters().page - 1)"
                aria-label="Página anterior"
              >
                <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </button>
              <span style="font-size: 12.5px; color: var(--text-muted); min-width: 52px; text-align: center">
                {{ vehicleStore.filters().page }} / {{ totalPages() }}
              </span>
              <button
                type="button"
                class="btn icon"
                [disabled]="vehicleStore.filters().page >= totalPages()"
                (click)="onPageChange(vehicleStore.filters().page + 1)"
                aria-label="Próxima página"
              >
                <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>
        }

      </div>

    </div>

    <ng-template #emptyTpl>
      @if (vehicleStore.hasActiveFilters()) {
        <div class="empty" style="padding: 32px 24px">
          <p>Nenhum resultado para os filtros aplicados.</p>
          <div style="margin-top: 12px">
            <app-button (clicked)="vehicleStore.resetFilters(); resetFilterSelects()">Limpar filtros</app-button>
          </div>
        </div>
      } @else {
        <div class="empty" style="padding: 32px 24px">
          <p>Nenhum veículo na frota. Cadastre o primeiro para começar.</p>
          <div style="margin-top: 12px">
            <app-button variant="primary" (clicked)="navigateToCreate()">+ Novo Veículo</app-button>
          </div>
        </div>
      }
    </ng-template>

    <ng-template #plateTemplate let-v>
      <span class="plate">{{ formatPlate(v.license_plate) }}</span>
    </ng-template>

    <ng-template #statusTemplate let-v>
      <app-badge
        [label]="vehicleStatusLabel(v.status)"
        [variant]="vehicleStatusVariant(v.status)"
        [dot]="true"
      />
    </ng-template>

    <ng-template #actionsTemplate let-v>
      <div class="cell-actions">
        <button
          type="button"
          title="Registrar operação"
          (click)="openOperation(v)"
          class="btn icon"
        >
          <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          type="button"
          title="Editar"
          (click)="edit(v)"
          class="btn icon"
        >
          <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button
          type="button"
          [title]="canDeleteVehicle(v).reason ?? 'Excluir'"
          [disabled]="!canDeleteVehicle(v).allowed"
          (click)="delete(v)"
          class="btn icon"
        >
          <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </ng-template>
  `,
})
export class VehicleListComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly vehicleStore = inject(VehicleStore)
  protected readonly catalogStore = inject(CatalogStore)
  private readonly dialogService = inject(DialogService)
  private readonly toast = inject(ToastService)
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)

  private operationDialogRef?: DialogRef<'registered' | 'cancelled'>
  private readonly searchInput$ = new Subject<string>()

  @ViewChild('plateTemplate', { static: true })
  plateTemplate!: TemplateRef<{ $implicit: Vehicle }>

  @ViewChild('statusTemplate', { static: true })
  statusTemplate!: TemplateRef<{ $implicit: Vehicle }>

  @ViewChild('actionsTemplate', { static: true })
  actionsTemplate!: TemplateRef<{ $implicit: Vehicle }>

  protected readonly formatPlate = formatPlate

  protected readonly columns = signal<TableColumn<Vehicle>[]>([])
  protected readonly searchValue = signal('')

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.vehicleStore.total() / this.vehicleStore.filters().page_size))
  )

  protected readonly rangeText = computed(() => {
    const { page, page_size } = this.vehicleStore.filters()
    const total = this.vehicleStore.total()
    if (total === 0) return ''
    const start = (page - 1) * page_size + 1
    const end = Math.min(page * page_size, total)
    return `Exibindo <strong style="font-weight:600;color:var(--text)">${start}–${end}</strong> de <strong style="font-weight:600;color:var(--text)">${total}</strong>`
  })

  protected readonly counterText = computed(() => {
    const total = this.vehicleStore.total()
    const count = this.vehicleStore.vehicles().length
    return this.vehicleStore.hasActiveFilters()
      ? `Exibindo ${count} de ${total} resultados`
      : `${total} veículo${total !== 1 ? 's' : ''}`
  })

  protected readonly yearOptions: number[] = Array.from(
    { length: new Date().getFullYear() - 1999 },
    (_, i) => new Date().getFullYear() - i
  )

  protected readonly vehicleStatusLabel = vehicleStatusLabel
  protected readonly vehicleStatusVariant = vehicleStatusVariant
  protected readonly canDeleteVehicle = canDeleteVehicle
  protected readonly vehicleRowClass = (v: Vehicle): string =>
    v.status === 'inativo' ? 'dimmed' : ''

  ngOnInit(): void {
    this.catalogStore.loadIfEmpty()
    this.vehicleStore.loadVehicles()
    this.searchInput$.pipe(
      debounceTime(220),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(term => {
      this.vehicleStore.applyFilter({ search: term || undefined })
    })
  }

  ngAfterViewInit(): void {
    this.columns.set([
      { key: 'license_plate', label: 'Placa', width: '120px', cellTemplate: this.plateTemplate },
      { key: 'brand_name',    label: 'Marca',  cellClass: 'fw-500' },
      { key: 'model_name',    label: 'Modelo' },
      { key: 'year',          label: 'Ano',       width: '70px', cellClass: 'mono' },
      { key: 'status',        label: 'Status',    width: '140px', cellTemplate: this.statusTemplate },
      { key: 'last_odometer_km', label: 'Odômetro',  width: '110px', align: 'right',  cellClass: 'font-mono tabular-nums text-muted', render: v => formatKm(v.last_odometer_km) },
      { key: 'operation_count', label: 'Operações', width: '90px',  align: 'center', cellClass: 'text-muted', render: v => String(v.operation_count ?? 0) },
      { key: 'actions',       label: '',          width: '130px', cellTemplate: this.actionsTemplate, action: true },
    ])
  }

  onSearchChange(term: string): void {
    this.searchValue.set(term)
    this.searchInput$.next(term)
  }

  clearSearch(): void {
    this.searchValue.set('')
    this.searchInput$.next('')
  }

  onStatusChange(status: string): void {
    this.vehicleStore.applyFilter({ status: (status || undefined) as VehicleStatus | undefined })
  }

  onBrandChange(brandId: string): void {
    this.vehicleStore.applyFilter({ brand_id: brandId || undefined })
  }

  onYearChange(year: string): void {
    this.vehicleStore.applyFilter({ year: year ? Number(year) : undefined })
  }

  onPageChange(page: number): void {
    this.vehicleStore.setPage(page)
  }

  onPageSizeChange(size: number): void {
    this.vehicleStore.setPageSize(size)
  }

  navigateToCreate(): void {
    this.router.navigate(['/vehicles', 'new'])
  }

  edit(v: Vehicle): void {
    this.vehicleStore.setSelectedVehicle(v)
    this.router.navigate(['/vehicles', v.id, 'edit'])
  }

  openOperation(vehicle: Vehicle): void {
    this.operationDialogRef = this.dialogService.open<'registered' | 'cancelled', OperationDialogData>(
      OperationDialogComponent,
      { data: { vehicle }, width: '480px' }
    )
    this.operationDialogRef.closed.pipe(take(1)).subscribe(result => {
      if (result === 'registered') this.vehicleStore.loadVehicles()
    })
  }

  delete(v: Vehicle): void {
    const guard = canDeleteVehicle(v)
    if (!guard.allowed) {
      this.toast.show(guard.reason!, 'warning')
      return
    }
    this.dialogService.confirm({
      title: 'Excluir veículo',
      message: `Tem certeza que deseja excluir ${formatPlate(v.license_plate)}? Esta ação não pode ser desfeita.`,
      variant: 'danger',
      confirmLabel: 'Excluir',
    }).subscribe(confirmed => {
      if (!confirmed) return
      this.vehicleStore.deleteVehicle(v.id).subscribe({
        next: () => this.toast.show('Veículo excluído com sucesso', 'success'),
      })
    })
  }

  resetFilterSelects(): void {
    this.searchValue.set('')
  }

  ngOnDestroy(): void {
    this.operationDialogRef?.close()
  }
}

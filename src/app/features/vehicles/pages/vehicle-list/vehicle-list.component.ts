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
    <div class="flex flex-col h-full">

      <div class="flex items-center justify-between px-6 py-5 border-b border-border">
        <div>
          <h1 class="text-[17px] font-semibold text-text">Veículos</h1>
          <p class="text-[12.5px] text-muted mt-0.5">{{ counterText() }}</p>
        </div>
        <app-button variant="primary" (clicked)="navigateToCreate()">+ Novo Veículo</app-button>
      </div>

      <div class="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-border">
        <input
          type="text"
          placeholder="Buscar placa, modelo..."
          [value]="searchValue()"
          (input)="onSearchChange($any($event.target).value)"
          class="h-[32px] min-w-[220px] rounded-[5px] border border-border-strong bg-surface-raised px-[10px] text-[13px] text-text placeholder:text-muted outline-none focus-visible:border-border-focus focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] transition-[border-color,box-shadow] duration-[80ms]"
        />
        <select
          (change)="onStatusChange($any($event.target).value)"
          class="h-[32px] rounded-[5px] border border-border-strong bg-surface-raised px-[10px] text-[13px] text-text outline-none cursor-pointer focus-visible:border-border-focus"
        >
          <option value="">Status</option>
          <option value="disponivel">Disponível</option>
          <option value="em_locacao">Em Locação</option>
          <option value="em_manutencao">Manutenção</option>
          <option value="inativo">Inativo</option>
        </select>
        <select
          (change)="onBrandChange($any($event.target).value)"
          class="h-[32px] rounded-[5px] border border-border-strong bg-surface-raised px-[10px] text-[13px] text-text outline-none cursor-pointer focus-visible:border-border-focus"
        >
          <option value="">Marca</option>
          @for (brand of catalogStore.brands(); track brand.id) {
            <option [value]="brand.id">{{ brand.name }}</option>
          }
        </select>
        <select
          (change)="onYearChange($any($event.target).value)"
          class="h-[32px] rounded-[5px] border border-border-strong bg-surface-raised px-[10px] text-[13px] text-text outline-none cursor-pointer focus-visible:border-border-focus"
        >
          <option value="">Ano</option>
          @for (year of yearOptions; track year) {
            <option [value]="year">{{ year }}</option>
          }
        </select>
        @if (vehicleStore.hasActiveFilters()) {
          <button
            type="button"
            (click)="vehicleStore.resetFilters(); resetFilterSelects()"
            class="h-[32px] px-3 text-[12.5px] text-muted hover:text-text transition-colors cursor-pointer"
          >
            Limpar filtros
          </button>
        }
      </div>

      <div class="flex-1 overflow-auto px-6 py-4">
        @if (vehicleStore.loadError()) {
          <div class="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <p class="text-[14px] text-muted">Não foi possível carregar os veículos.</p>
            <app-button (clicked)="vehicleStore.loadVehicles()">Tentar novamente</app-button>
          </div>
        } @else {
          <app-data-table
            [rows]="vehicleStore.vehicles()"
            [columns]="columns()"
            [loading]="vehicleStore.loading()"
            [emptyTemplate]="emptyTpl"
          />
        }
      </div>

      @if (!vehicleStore.loadError() && vehicleStore.total() > 0) {
        <div class="flex items-center justify-between border-t border-border px-6 py-3">
          <div class="flex items-center gap-2">
            <button
              type="button"
              [disabled]="vehicleStore.filters().page <= 1"
              (click)="onPageChange(vehicleStore.filters().page - 1)"
              class="h-[28px] px-3 text-[12.5px] rounded-[5px] border border-border-strong bg-surface-raised text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              ← Anterior
            </button>
            <span class="text-[12.5px] text-muted px-2">
              Página {{ vehicleStore.filters().page }} de {{ totalPages() }}
            </span>
            <button
              type="button"
              [disabled]="vehicleStore.filters().page >= totalPages()"
              (click)="onPageChange(vehicleStore.filters().page + 1)"
              class="h-[28px] px-3 text-[12.5px] rounded-[5px] border border-border-strong bg-surface-raised text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              Próxima →
            </button>
          </div>
          <select
            [value]="vehicleStore.filters().page_size"
            (change)="onPageSizeChange(+$any($event.target).value)"
            class="h-[28px] rounded-[5px] border border-border-strong bg-surface-raised px-2 text-[12.5px] text-text outline-none cursor-pointer"
          >
            <option value="10">10 / pág</option>
            <option value="25">25 / pág</option>
            <option value="50">50 / pág</option>
          </select>
        </div>
      }

    </div>

    <ng-template #emptyTpl>
      @if (vehicleStore.hasActiveFilters()) {
        <div class="flex flex-col items-center gap-3 py-6">
          <p class="text-[13px] text-muted">Nenhum resultado para os filtros aplicados.</p>
          <app-button (clicked)="vehicleStore.resetFilters(); resetFilterSelects()">Limpar filtros</app-button>
        </div>
      } @else {
        <div class="flex flex-col items-center gap-3 py-6">
          <p class="text-[13px] text-muted">Nenhum veículo na frota. Cadastre o primeiro para começar.</p>
          <app-button variant="primary" (clicked)="navigateToCreate()">+ Novo Veículo</app-button>
        </div>
      }
    </ng-template>

    <ng-template #statusTemplate let-v>
      <app-badge
        [label]="vehicleStatusLabel(v.status)"
        [variant]="vehicleStatusVariant(v.status)"
        [dot]="true"
      />
    </ng-template>

    <ng-template #actionsTemplate let-v>
      <div class="flex items-center gap-1">
        <button
          type="button"
          title="Editar"
          (click)="edit(v)"
          class="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[4px] text-muted hover:bg-surface-elevated hover:text-text transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button
          type="button"
          title="Registrar operação"
          (click)="openOperation(v)"
          class="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[4px] text-muted hover:bg-surface-elevated hover:text-text transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          type="button"
          [title]="canDeleteVehicle(v).reason ?? 'Excluir'"
          [disabled]="!canDeleteVehicle(v).allowed"
          (click)="delete(v)"
          [class]="deleteButtonClass(v)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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

  @ViewChild('statusTemplate', { static: true })
  statusTemplate!: TemplateRef<{ $implicit: Vehicle }>

  @ViewChild('actionsTemplate', { static: true })
  actionsTemplate!: TemplateRef<{ $implicit: Vehicle }>

  protected readonly columns = signal<TableColumn<Vehicle>[]>([])
  protected readonly searchValue = signal('')

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.vehicleStore.total() / this.vehicleStore.filters().page_size))
  )

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
      { key: 'license_plate', label: 'Placa', render: v => formatPlate(v.license_plate) },
      { key: 'brand_name', label: 'Marca' },
      { key: 'model_name', label: 'Modelo' },
      { key: 'year', label: 'Ano', width: '80px' },
      { key: 'status', label: 'Status', cellTemplate: this.statusTemplate },
      { key: 'actions', label: '', cellTemplate: this.actionsTemplate, action: true },
    ])
  }

  onSearchChange(term: string): void {
    this.searchValue.set(term)
    this.searchInput$.next(term)
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

  protected deleteButtonClass(v: Vehicle): string {
    const base = 'inline-flex h-[26px] w-[26px] items-center justify-center rounded-[4px] transition-colors'
    return canDeleteVehicle(v).allowed
      ? `${base} text-muted hover:bg-danger-soft hover:text-danger-text cursor-pointer`
      : `${base} text-muted opacity-40 cursor-not-allowed`
  }

  ngOnDestroy(): void {
    this.operationDialogRef?.close()
  }
}

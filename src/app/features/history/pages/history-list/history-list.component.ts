import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  computed,
  inject,
} from '@angular/core'
import { BadgeComponent } from '../../../../shared/components/atoms/badge/badge.component'
import { DataTableComponent } from '../../../../shared/components/molecules/data-table/data-table.component'
import { TableColumn } from '../../../../shared/components/molecules/data-table/table-column.model'
import { PaginationComponent } from '../../../../shared/components/molecules/pagination/pagination.component'
import { PlateFormatPipe } from '../../../../shared/pipes/plate-format.pipe'
import { OperationType, VehicleOperation } from '../../models/history.models'
import { HistoryStore } from '../../store/history.store'
import { operationBadgeVariant, operationLabel } from '../../utils/operation.utils'

@Component({
  selector: 'app-history-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, BadgeComponent, PlateFormatPipe, PaginationComponent],
  template: `
    <div class="flex flex-col gap-6 p-6">

      <!-- Header -->
      <div class="flex flex-col gap-0.5">
        <h1 class="text-[18px] font-[650] text-text leading-snug">Histórico de Operações</h1>
        <p class="text-[13px] text-muted">Registro completo do ciclo de vida da frota</p>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex flex-col gap-1 min-w-[200px]">
          <label class="text-[12px] font-medium text-muted leading-none">Buscar placa</label>
          <input
            type="text"
            placeholder="Ex: ABC-1234"
            class="h-9 rounded-[5px] border border-border bg-surface px-3 text-[13px] text-text placeholder:text-subtle outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            (input)="onSearchChange($event)"
          />
        </div>

        <div class="flex flex-col gap-1 min-w-[160px]">
          <label class="text-[12px] font-medium text-muted leading-none">Tipo</label>
          <select
            class="h-9 rounded-[5px] border border-border bg-surface px-3 text-[13px] text-text outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors cursor-pointer"
            (change)="onTypeChange($event)"
          >
            @for (opt of operationTypeOptions; track opt.value) {
              <option [value]="opt.value">{{ opt.label }}</option>
            }
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[12px] font-medium text-muted leading-none">Data início</label>
          <input
            type="date"
            class="h-9 rounded-[5px] border border-border bg-surface px-3 text-[13px] text-text outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            (change)="onDateFromChange($event)"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[12px] font-medium text-muted leading-none">Data fim</label>
          <input
            type="date"
            class="h-9 rounded-[5px] border border-border bg-surface px-3 text-[13px] text-text outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            (change)="onDateToChange($event)"
          />
        </div>
      </div>

      <!-- Table -->
      <app-data-table
        [rows]="store.operations()"
        [columns]="columns()"
        [loading]="store.loading()"
        [emptyTemplate]="emptyTpl"
      />

      <!-- Pagination -->
      <app-pagination
        [total]="store.total()"
        [page]="store.filters().page"
        [pageSize]="store.filters().page_size"
        (pageChange)="onPageChange($event)"
      />

    </div>

    <!-- Cell Templates -->
    <ng-template #dateCellTemplate let-op>
      <span class="text-[12.5px] tabular-nums text-muted">{{ formatDate(op.created_at) }}</span>
    </ng-template>

    <ng-template #plateCellTemplate let-op>
      <span class="font-mono text-[12.5px] font-[550] tracking-wide text-text">
        {{ op.vehicle_plate | plateFormat }}
      </span>
    </ng-template>

    <ng-template #badgeCellTemplate let-op>
      <app-badge
        [label]="getBadgeLabel(op.type)"
        [variant]="getBadgeVariant(op.type)"
        size="sm"
      />
    </ng-template>

    <!-- Empty State -->
    <ng-template #emptyTpl>
      @if (store.hasActiveFilters()) {
        <div class="flex flex-col items-center gap-1">
          <span class="text-[13px] font-medium text-text">Nenhuma operação encontrada</span>
          <span class="text-[12px] text-muted">Tente ajustar ou limpar os filtros aplicados</span>
        </div>
      } @else {
        <div class="flex flex-col items-center gap-1">
          <span class="text-[13px] font-medium text-text">Nenhuma operação registrada</span>
          <span class="text-[12px] text-muted">As operações da frota aparecerão aqui</span>
        </div>
      }
    </ng-template>
  `,
})
export class HistoryListComponent implements OnInit, OnDestroy {
  protected readonly store = inject(HistoryStore)

  @ViewChild('dateCellTemplate', { static: true }) private dateCellTemplate!: TemplateRef<{ $implicit: VehicleOperation }>
  @ViewChild('plateCellTemplate', { static: true }) private plateCellTemplate!: TemplateRef<{ $implicit: VehicleOperation }>
  @ViewChild('badgeCellTemplate', { static: true }) private badgeCellTemplate!: TemplateRef<{ $implicit: VehicleOperation }>

  protected readonly operationTypeOptions: { value: OperationType | ''; label: string }[] = [
    { value: '', label: 'Todos os tipos' },
    { value: 'check_in', label: 'Entrada' },
    { value: 'check_out', label: 'Saída' },
    { value: 'maintenance', label: 'Manutenção' },
    { value: 'deactivation', label: 'Desativação' },
    { value: 'reactivation', label: 'Reativação' },
    { value: 'status_change', label: 'Alteração' },
  ]

  readonly columns = computed<TableColumn<VehicleOperation>[]>(() => [
    { key: 'created_at', label: 'Data/Hora', cellTemplate: this.dateCellTemplate, width: '180px' },
    { key: 'vehicle_plate', label: 'Veículo', cellTemplate: this.plateCellTemplate, width: '120px' },
    { key: 'type', label: 'Operação', cellTemplate: this.badgeCellTemplate, width: '140px' },
    { key: 'odometer_km', label: 'KM', render: (op) => op.odometer_km != null ? `${op.odometer_km.toLocaleString('pt-BR')} km` : '—', width: '100px' },
    { key: 'notes', label: 'Notas', render: (op) => op.notes ?? '—' },
    { key: 'performed_by', label: 'Responsável', width: '130px' },
  ])

  private searchDebounce: ReturnType<typeof setTimeout> | null = null

  ngOnInit(): void {
    this.store.loadOperations()
  }

  ngOnDestroy(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce)
  }

  protected onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    if (this.searchDebounce) clearTimeout(this.searchDebounce)
    this.searchDebounce = setTimeout(() => {
      this.store.applyFilter({ vehicle_plate: value || undefined })
    }, 400)
  }

  protected onTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as OperationType | ''
    this.store.applyFilter({ type: value || undefined })
  }

  protected onDateFromChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    this.store.applyFilter({ date_from: value || undefined })
  }

  protected onDateToChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    this.store.applyFilter({ date_to: value || undefined })
  }

  protected onPageChange(page: number): void {
    this.store.applyFilter({ page })
  }

  protected formatDate(isoString: string): string {
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  protected getBadgeLabel(type: OperationType): string {
    return operationLabel(type)
  }

  protected getBadgeVariant(type: OperationType) {
    return operationBadgeVariant(type)
  }
}

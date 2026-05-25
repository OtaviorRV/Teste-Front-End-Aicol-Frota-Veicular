import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { BadgeComponent } from '../../../../shared/components/atoms/badge/badge.component'
import { DataTableComponent } from '../../../../shared/components/molecules/data-table/data-table.component'
import { TableColumn } from '../../../../shared/components/molecules/data-table/table-column.model'
import { PlateFormatPipe } from '../../../../shared/pipes/plate-format.pipe'
import { OperationType, VehicleOperation } from '../../models/history.models'
import { HistoryStore } from '../../store/history.store'
import { operationBadgeVariant, operationLabel } from '../../utils/operation.utils'

@Component({
  selector: 'app-history-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, BadgeComponent, PlateFormatPipe],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1 class="page-title">Histórico de Operações</h1>
          <p class="page-subtitle">Registro auditável do ciclo de vida da frota — entradas, saídas, manutenções e baixas.</p>
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
                  placeholder="Buscar por placa…"
                  class="input"
                  style="padding-right: 36px"
                  [value]="searchValue()"
                  (input)="onSearchInput($any($event.target).value)"
                />
                @if (searchValue()) {
                  <button type="button" class="btn icon trailing-btn" aria-label="Limpar busca" (click)="clearSearch()">
                    <svg xmlns="http://www.w3.org/2000/svg" style="width:12px;height:12px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                }
              </div>
            </div>

            <div class="select-wrap" style="width: auto">
              <select class="select" style="width: auto" [value]="typeValue()" (change)="onTypeChange($any($event.target).value)">
                <option value="">Todos os tipos</option>
                @for (opt of typeOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            </div>

            <input
              type="date"
              class="input"
              style="width: 150px"
              [value]="dateFrom()"
              (change)="onDateFromChange($any($event.target).value)"
            />
            <input
              type="date"
              class="input"
              style="width: 150px"
              [value]="dateTo()"
              (change)="onDateToChange($any($event.target).value)"
            />
          </div>
          <div class="right">
            @if (store.hasActiveFilters()) {
              <button type="button" class="btn ghost sm" (click)="resetFilters()">Limpar filtros</button>
            }
          </div>
        </div>

        <app-data-table
          [rows]="store.operations()"
          [columns]="columns()"
          [loading]="store.loading()"
          [emptyTemplate]="emptyTpl"
          [noBorder]="true"
        />

        @if (!store.loading() && store.total() > 0) {
          <div class="pagination">
            <span [innerHTML]="rangeText()"></span>
            <div class="controls">
              <button
                type="button"
                class="btn icon"
                [disabled]="store.filters().page <= 1"
                (click)="onPageChange(store.filters().page - 1)"
                aria-label="Página anterior"
              >
                <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </button>
              <span style="font-size:12.5px;color:var(--text-muted);min-width:52px;text-align:center">
                {{ store.filters().page }} / {{ totalPages() }}
              </span>
              <button
                type="button"
                class="btn icon"
                [disabled]="store.filters().page >= totalPages()"
                (click)="onPageChange(store.filters().page + 1)"
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

    <!-- Cell templates -->
    <ng-template #dateCellTemplate let-op>
      <div style="font-size:12.5px">{{ formatDateTime(op.created_at) }}</div>
      <div style="font-size:11.5px;color:var(--text-subtle)">{{ formatRelative(op.created_at) }}</div>
    </ng-template>

    <ng-template #plateCellTemplate let-op>
      <span class="plate">{{ op.vehicle_plate | plateFormat }}</span>
    </ng-template>

    <ng-template #badgeCellTemplate let-op>
      <app-badge [label]="opLabel(op.type)" [variant]="opVariant(op.type)" />
    </ng-template>

    <ng-template #notesCellTemplate let-op>
      @if (op.notes) {
        <span style="font-size:12.5px">{{ op.notes }}</span>
      } @else {
        <span style="font-size:12.5px;color:var(--text-subtle)">—</span>
      }
    </ng-template>

    <ng-template #odometerCellTemplate let-op>
      @if (op.odometer_km != null) {
        <span class="mono text-sm">{{ op.odometer_km.toLocaleString('pt-BR') }} km</span>
      } @else {
        <span style="font-size:12.5px;color:var(--text-subtle)">—</span>
      }
    </ng-template>

    <ng-template #returnDateCellTemplate let-op>
      @if (op.expected_return_date) {
        <span style="font-size:12.5px">{{ formatDate(op.expected_return_date) }}</span>
      } @else {
        <span style="font-size:12.5px;color:var(--text-subtle)">—</span>
      }
    </ng-template>

    <ng-template #responsibleCellTemplate let-op>
      <div style="display:flex;align-items:center;gap:6px">
        <div class="avatar" style="width:18px;height:18px;font-size:9px;flex-shrink:0">
          {{ (op.performed_by || '?')[0].toUpperCase() }}
        </div>
        <span style="font-size:12.5px">{{ op.performed_by }}</span>
      </div>
    </ng-template>

    <ng-template #emptyTpl>
      <div class="empty">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <div class="title">
          {{ store.hasActiveFilters() ? 'Nenhuma operação encontrada' : 'Nenhuma operação registrada' }}
        </div>
        <p class="desc">
          {{ store.hasActiveFilters() ? 'Ajuste os filtros para ver outros resultados.' : 'Operações sobre veículos aparecerão aqui.' }}
        </p>
        @if (store.hasActiveFilters()) {
          <button type="button" class="btn secondary" (click)="resetFilters()">Limpar filtros</button>
        }
      </div>
    </ng-template>
  `,
})
export class HistoryListComponent implements OnInit, AfterViewInit {
  protected readonly store = inject(HistoryStore)
  private readonly destroyRef = inject(DestroyRef)

  @ViewChild('dateCellTemplate',        { static: true }) private dateCellTemplate!: TemplateRef<{ $implicit: VehicleOperation }>
  @ViewChild('plateCellTemplate',       { static: true }) private plateCellTemplate!: TemplateRef<{ $implicit: VehicleOperation }>
  @ViewChild('badgeCellTemplate',       { static: true }) private badgeCellTemplate!: TemplateRef<{ $implicit: VehicleOperation }>
  @ViewChild('notesCellTemplate',       { static: true }) private notesCellTemplate!: TemplateRef<{ $implicit: VehicleOperation }>
  @ViewChild('odometerCellTemplate',    { static: true }) private odometerCellTemplate!: TemplateRef<{ $implicit: VehicleOperation }>
  @ViewChild('returnDateCellTemplate',  { static: true }) private returnDateCellTemplate!: TemplateRef<{ $implicit: VehicleOperation }>
  @ViewChild('responsibleCellTemplate', { static: true }) private responsibleCellTemplate!: TemplateRef<{ $implicit: VehicleOperation }>

  protected readonly searchValue = signal('')
  protected readonly typeValue   = signal('')
  protected readonly dateFrom    = signal('')
  protected readonly dateTo      = signal('')

  private readonly searchSubject$ = new Subject<string>()

  protected readonly columns = signal<TableColumn<VehicleOperation>[]>([])

  protected readonly typeOptions: { value: OperationType; label: string }[] = [
    { value: 'check_in',     label: 'Entrada' },
    { value: 'check_out',    label: 'Saída' },
    { value: 'maintenance',  label: 'Manutenção' },
    { value: 'deactivation', label: 'Desativação' },
    { value: 'reactivation', label: 'Reativação' },
  ]

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.store.total() / this.store.filters().page_size))
  )

  protected readonly rangeText = computed(() => {
    const { page, page_size } = this.store.filters()
    const total = this.store.total()
    if (total === 0) return ''
    const start = (page - 1) * page_size + 1
    const end   = Math.min(page * page_size, total)
    return `Exibindo <strong style="font-weight:600;color:var(--text)">${start}–${end}</strong> de <strong style="font-weight:600;color:var(--text)">${total}</strong>`
  })

  protected readonly opLabel   = (t: OperationType) => operationLabel(t)
  protected readonly opVariant = (t: OperationType) => operationBadgeVariant(t)

  ngOnInit(): void {
    this.store.loadOperations()
    this.searchSubject$.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(term => {
      this.store.applyFilter({ vehicle_plate: term || undefined })
    })
  }

  ngAfterViewInit(): void {
    this.columns.set([
      { key: 'created_at',           label: 'Data/Hora',  width: '170px', cellTemplate: this.dateCellTemplate },
      { key: 'vehicle_plate',        label: 'Veículo',    width: '120px', cellTemplate: this.plateCellTemplate },
      { key: 'type',                 label: 'Operação',   width: '140px', cellTemplate: this.badgeCellTemplate },
      { key: 'notes',                label: 'Observações',                cellTemplate: this.notesCellTemplate },
      { key: 'odometer_km',          label: 'Odômetro',   width: '110px', align: 'right', cellTemplate: this.odometerCellTemplate },
      { key: 'expected_return_date', label: 'Devolução',  width: '130px', cellTemplate: this.returnDateCellTemplate },
      { key: 'performed_by',         label: 'Responsável',width: '110px', cellTemplate: this.responsibleCellTemplate },
    ])
  }

  protected onSearchInput(value: string): void {
    this.searchValue.set(value)
    this.searchSubject$.next(value)
  }

  protected clearSearch(): void {
    this.searchValue.set('')
    this.searchSubject$.next('')
  }

  protected onTypeChange(value: string): void {
    this.typeValue.set(value)
    this.store.applyFilter({ type: (value || undefined) as OperationType | undefined })
  }

  protected onDateFromChange(value: string): void {
    this.dateFrom.set(value)
    this.store.applyFilter({ date_from: value || undefined })
  }

  protected onDateToChange(value: string): void {
    this.dateTo.set(value)
    this.store.applyFilter({ date_to: value || undefined })
  }

  protected onPageChange(page: number): void {
    this.store.applyFilter({ page })
  }

  protected resetFilters(): void {
    this.searchValue.set('')
    this.typeValue.set('')
    this.dateFrom.set('')
    this.dateTo.set('')
    this.store.applyFilter({ vehicle_plate: undefined, type: undefined, date_from: undefined, date_to: undefined })
  }

  protected formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  }

  protected formatRelative(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'agora'
    if (m < 60) return `há ${m}min`
    const h = Math.floor(m / 60)
    if (h < 24) return `há ${h}h`
    const d = Math.floor(h / 24)
    return `há ${d}d`
  }
}

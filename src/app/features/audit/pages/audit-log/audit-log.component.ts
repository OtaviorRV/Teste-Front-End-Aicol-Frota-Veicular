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
import { JsonPipe } from '@angular/common'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { BadgeComponent } from '../../../../shared/components/atoms/badge/badge.component'
import { DataTableComponent } from '../../../../shared/components/molecules/data-table/data-table.component'
import { TableColumn } from '../../../../shared/components/molecules/data-table/table-column.model'
import { AuditEntry, AuditEntity, AuditMethod } from '../../models/audit-entry.model'
import { AuditStore } from '../../store/audit.store'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent' | 'outline'

@Component({
  selector: 'app-audit-log',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AuditStore],
  imports: [DataTableComponent, BadgeComponent, JsonPipe],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1 class="page-title">Auditoria</h1>
          <p class="page-subtitle">Log completo de mutações no backend — entidade, método, payload before/after.</p>
        </div>
        <span class="badge outline" style="align-self:center;gap:5px">
          <svg style="width:11px;height:11px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
          MongoDB · audit_log
        </span>
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
                  placeholder="Filtrar por usuário…"
                  class="input"
                  style="padding-right: 36px"
                  [value]="userValue()"
                  (input)="onUserInput($any($event.target).value)"
                />
                @if (userValue()) {
                  <button type="button" class="btn icon trailing-btn" aria-label="Limpar busca" (click)="clearUser()">
                    <svg xmlns="http://www.w3.org/2000/svg" style="width:12px;height:12px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                }
              </div>
            </div>

            <div class="select-wrap" style="width: auto">
              <select class="select" style="width: 130px" [value]="methodValue()" (change)="onMethodChange($any($event.target).value)">
                <option value="">Método</option>
                @for (opt of methodOptions; track opt) {
                  <option [value]="opt">{{ opt }}</option>
                }
              </select>
            </div>

            <div class="select-wrap" style="width: auto">
              <select class="select" style="width: 150px" [value]="entityValue()" (change)="onEntityChange($any($event.target).value)">
                <option value="">Entidade</option>
                @for (opt of entityOptions; track opt.value) {
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
              <button type="button" class="btn ghost sm" (click)="resetFilters()">Limpar</button>
            }
          </div>
        </div>

        <app-data-table
          [rows]="store.entries()"
          [columns]="columns()"
          [loading]="store.loading()"
          [emptyTemplate]="emptyTpl"
          [noBorder]="true"
        />

        <!-- Expanded payload panel -->
        @if (expandedEntry()) {
          <div style="border-top:1px solid var(--border);padding:16px 20px;background:var(--bg-elevated)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <span style="font-size:11.5px;font-weight:600;color:var(--text-subtle);text-transform:uppercase;letter-spacing:0.04em">Payload — {{ expandedEntry()!.entity }} · {{ expandedEntry()!.entity_id ?? '—' }}</span>
              <button type="button" class="btn ghost sm" (click)="store.toggleExpand(expandedEntry()!.id)">Fechar</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div>
                <div style="font-size:11px;font-weight:600;color:var(--text-subtle);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Before</div>
                <pre class="json-viewer">{{ expandedEntry()!.payload?.before | json }}</pre>
              </div>
              <div>
                <div style="font-size:11px;font-weight:600;color:var(--text-subtle);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">After</div>
                <pre class="json-viewer">{{ expandedEntry()!.payload?.after | json }}</pre>
              </div>
            </div>
          </div>
        }

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
    <ng-template #expandTpl let-entry>
      <button
        type="button"
        class="btn icon"
        style="width:22px;height:22px"
        [attr.aria-label]="store.expandedEntryId() === entry.id ? 'Recolher' : 'Expandir payload'"
        (click)="store.toggleExpand(entry.id)"
      >
        <svg style="width:12px;height:12px;transition:transform 0.15s" [style.transform]="store.expandedEntryId() === entry.id ? 'rotate(90deg)' : 'none'" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
        </svg>
      </button>
    </ng-template>

    <ng-template #timestampTpl let-entry>
      <div style="font-size:12.5px">{{ formatDateTime(entry.timestamp) }}</div>
      <div style="font-size:11.5px;color:var(--text-subtle)">{{ formatRelative(entry.timestamp) }}</div>
    </ng-template>

    <ng-template #userTpl let-entry>
      <div style="display:flex;align-items:center;gap:6px">
        <div class="avatar" style="width:18px;height:18px;font-size:9px;flex-shrink:0">
          {{ entry.user[0].toUpperCase() }}
        </div>
        <span style="font-size:12.5px">{{ entry.user }}</span>
      </div>
    </ng-template>

    <ng-template #methodTpl let-entry>
      <span [class]="'method-tag ' + entry.method.toLowerCase()">{{ entry.method }}</span>
    </ng-template>

    <ng-template #entityTpl let-entry>
      <span style="font-size:12.5px;font-weight:500;text-transform:capitalize">{{ entry.entity }}</span>
    </ng-template>

    <ng-template #statusTpl let-entry>
      <app-badge
        [label]="entry.response_status.toString()"
        [variant]="statusVariant(entry.response_status)"
      />
    </ng-template>

    <ng-template #emptyTpl>
      <div class="empty">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <div class="title">
          {{ store.hasActiveFilters() ? 'Nenhum registro encontrado' : 'Nenhum log de auditoria' }}
        </div>
        <p class="desc">
          {{ store.hasActiveFilters() ? 'Ajuste os filtros para ver outros resultados.' : 'Mutações no backend aparecerão aqui.' }}
        </p>
        @if (store.hasActiveFilters()) {
          <button type="button" class="btn secondary" (click)="resetFilters()">Limpar filtros</button>
        }
      </div>
    </ng-template>
  `,
})
export class AuditLogComponent implements OnInit, AfterViewInit {
  protected readonly store = inject(AuditStore)
  private readonly destroyRef = inject(DestroyRef)

  @ViewChild('expandTpl',    { static: true }) private expandTpl!: TemplateRef<{ $implicit: AuditEntry }>
  @ViewChild('timestampTpl', { static: true }) private timestampTpl!: TemplateRef<{ $implicit: AuditEntry }>
  @ViewChild('userTpl',      { static: true }) private userTpl!: TemplateRef<{ $implicit: AuditEntry }>
  @ViewChild('methodTpl',    { static: true }) private methodTpl!: TemplateRef<{ $implicit: AuditEntry }>
  @ViewChild('entityTpl',    { static: true }) private entityTpl!: TemplateRef<{ $implicit: AuditEntry }>
  @ViewChild('statusTpl',    { static: true }) private statusTpl!: TemplateRef<{ $implicit: AuditEntry }>

  protected readonly userValue   = signal('')
  protected readonly methodValue = signal('')
  protected readonly entityValue = signal('')
  protected readonly dateFrom    = signal('')
  protected readonly dateTo      = signal('')

  private readonly userSubject$ = new Subject<string>()

  protected readonly columns = signal<TableColumn<AuditEntry>[]>([])

  protected readonly methodOptions = ['POST', 'PATCH', 'DELETE', 'GET'] as const

  protected readonly entityOptions: { value: AuditEntity; label: string }[] = [
    { value: 'vehicle',   label: 'Veículo' },
    { value: 'operation', label: 'Operação' },
    { value: 'brand',     label: 'Marca' },
    { value: 'model',     label: 'Modelo' },
    { value: 'auth',      label: 'Auth' },
  ]

  readonly expandedEntry = computed(() => {
    const id = this.store.expandedEntryId()
    if (!id) return null
    return this.store.entries().find(e => e.id === id) ?? null
  })

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

  ngOnInit(): void {
    this.store.loadEntries()
    this.userSubject$.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(term => {
      this.store.applyFilter({ user: term || undefined })
    })
  }

  ngAfterViewInit(): void {
    this.columns.set([
      { key: 'id',              label: '',          width: '28px',  cellTemplate: this.expandTpl,    action: true },
      { key: 'timestamp',       label: 'Data/Hora', width: '170px', cellTemplate: this.timestampTpl },
      { key: 'user',            label: 'Usuário',   width: '110px', cellTemplate: this.userTpl },
      { key: 'method',          label: 'Método',    width: '90px',  cellTemplate: this.methodTpl },
      { key: 'entity',          label: 'Entidade',  width: '110px', cellTemplate: this.entityTpl },
      { key: 'entity_id',       label: 'ID',                        render: e => e.entity_id ?? '—', cellClass: 'mono text-xs text-muted' },
      { key: 'response_status', label: 'Status',    width: '80px',  align: 'right', cellTemplate: this.statusTpl },
    ])
  }

  protected onUserInput(value: string): void {
    this.userValue.set(value)
    this.userSubject$.next(value)
  }

  protected clearUser(): void {
    this.userValue.set('')
    this.userSubject$.next('')
  }

  protected onMethodChange(value: string): void {
    this.methodValue.set(value)
    this.store.applyFilter({ method: (value || undefined) as AuditMethod | undefined })
  }

  protected onEntityChange(value: string): void {
    this.entityValue.set(value)
    this.store.applyFilter({ entity: (value || undefined) as AuditEntity | undefined })
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
    this.userValue.set('')
    this.methodValue.set('')
    this.entityValue.set('')
    this.dateFrom.set('')
    this.dateTo.set('')
    this.store.applyFilter({ user: undefined, method: undefined, entity: undefined, date_from: undefined, date_to: undefined })
  }

  protected statusVariant(status: number): BadgeVariant {
    if (status >= 500) return 'danger'
    if (status >= 400) return 'warning'
    if (status >= 300) return 'info'
    return 'success'
  }

  protected formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
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

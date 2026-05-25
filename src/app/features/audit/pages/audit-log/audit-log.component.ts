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
import { JsonPipe } from '@angular/common'
import { BadgeComponent } from '../../../../shared/components/atoms/badge/badge.component'
import { DataTableComponent } from '../../../../shared/components/molecules/data-table/data-table.component'
import { TableColumn } from '../../../../shared/components/molecules/data-table/table-column.model'
import { PaginationComponent } from '../../../../shared/components/molecules/pagination/pagination.component'
import { AuditEntry, AuditEntity, AuditMethod } from '../../models/audit-entry.model'
import { AuditStore } from '../../store/audit.store'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent' | 'outline'

@Component({
  selector: 'app-audit-log',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, BadgeComponent, PaginationComponent, JsonPipe],
  template: `
    <div class="flex flex-col gap-6 p-6">

      <!-- Header -->
      <div class="flex flex-col gap-0.5">
        <h1 class="text-[18px] font-[650] text-text leading-snug">Log de Auditoria</h1>
        <p class="text-[13px] text-muted">Registro imutável de todas as interações com o sistema</p>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex flex-col gap-1 min-w-[180px]">
          <label class="text-[12px] font-medium text-muted leading-none">Usuário</label>
          <input
            type="text"
            placeholder="Buscar por usuário"
            class="h-9 rounded-[5px] border border-border bg-surface px-3 text-[13px] text-text placeholder:text-subtle outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            (input)="onUserSearch($event)"
          />
        </div>

        <div class="flex flex-col gap-1 min-w-[140px]">
          <label class="text-[12px] font-medium text-muted leading-none">Método</label>
          <select
            class="h-9 rounded-[5px] border border-border bg-surface px-3 text-[13px] text-text outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors cursor-pointer"
            (change)="onMethodChange($event)"
          >
            @for (opt of methodOptions; track opt.value) {
              <option [value]="opt.value">{{ opt.label }}</option>
            }
          </select>
        </div>

        <div class="flex flex-col gap-1 min-w-[150px]">
          <label class="text-[12px] font-medium text-muted leading-none">Entidade</label>
          <select
            class="h-9 rounded-[5px] border border-border bg-surface px-3 text-[13px] text-text outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors cursor-pointer"
            (change)="onEntityChange($event)"
          >
            @for (opt of entityOptions; track opt.value) {
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
        [rows]="store.entries()"
        [columns]="columns()"
        [loading]="store.loading()"
        [emptyTemplate]="emptyTpl"
      />

      <!-- Payload Panel -->
      @if (expandedEntry()) {
        <div class="rounded-[6px] border border-border bg-surface-alt p-4 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-[12px] font-[600] text-text uppercase tracking-wide">Payload</span>
            <button
              class="text-[12px] text-muted hover:text-text transition-colors"
              (click)="store.toggleExpand(expandedEntry()!.id)"
            >
              Fechar
            </button>
          </div>
          @if (expandedEntry()!.payload?.before) {
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-[600] text-muted uppercase tracking-wide">Before</span>
              <pre class="text-[11.5px] text-text bg-canvas rounded-[4px] p-3 overflow-x-auto leading-relaxed">{{ expandedEntry()!.payload!.before | json }}</pre>
            </div>
          }
          @if (expandedEntry()!.payload?.after) {
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-[600] text-muted uppercase tracking-wide">After</span>
              <pre class="text-[11.5px] text-text bg-canvas rounded-[4px] p-3 overflow-x-auto leading-relaxed">{{ expandedEntry()!.payload!.after | json }}</pre>
            </div>
          }
          @if (!expandedEntry()!.payload?.before && !expandedEntry()!.payload?.after) {
            <span class="text-[12px] text-muted">Sem payload registrado para esta entrada.</span>
          }
        </div>
      }

      <!-- Pagination -->
      <app-pagination
        [total]="store.total()"
        [page]="store.filters().page"
        [pageSize]="store.filters().page_size"
        (pageChange)="onPageChange($event)"
      />

    </div>

    <!-- Cell Templates -->
    <ng-template #timestampTpl let-entry>
      <span class="text-[12.5px] tabular-nums text-muted">{{ formatDate(entry.timestamp) }}</span>
    </ng-template>

    <ng-template #methodTpl let-entry>
      <app-badge
        [label]="entry.method"
        [variant]="methodBadgeVariant(entry.method)"
        size="sm"
      />
    </ng-template>

    <ng-template #entityTpl let-entry>
      <app-badge
        [label]="entry.entity"
        variant="neutral"
        size="sm"
      />
    </ng-template>

    <ng-template #statusTpl let-entry>
      <app-badge
        [label]="entry.response_status.toString()"
        [variant]="statusBadgeVariant(entry.response_status)"
        size="sm"
      />
    </ng-template>

    <ng-template #payloadTpl let-entry>
      @if (entry.payload) {
        <button
          class="text-[12px] text-brand-500 hover:text-brand-600 transition-colors font-medium"
          (click)="store.toggleExpand(entry.id)"
        >
          {{ store.expandedEntryId() === entry.id ? 'Ocultar' : 'Ver' }}
        </button>
      } @else {
        <span class="text-[12px] text-subtle">—</span>
      }
    </ng-template>

    <!-- Empty State -->
    <ng-template #emptyTpl>
      @if (store.hasActiveFilters()) {
        <div class="flex flex-col items-center gap-1">
          <span class="text-[13px] font-medium text-text">Nenhum registro encontrado</span>
          <span class="text-[12px] text-muted">Tente ajustar ou limpar os filtros aplicados</span>
        </div>
      } @else {
        <div class="flex flex-col items-center gap-1">
          <span class="text-[13px] font-medium text-text">Nenhum log de auditoria</span>
          <span class="text-[12px] text-muted">As interações com o sistema aparecerão aqui</span>
        </div>
      }
    </ng-template>
  `,
})
export class AuditLogComponent implements OnInit, OnDestroy {
  protected readonly store = inject(AuditStore)

  @ViewChild('timestampTpl', { static: true }) private timestampTpl!: TemplateRef<{ $implicit: AuditEntry }>
  @ViewChild('methodTpl', { static: true }) private methodTpl!: TemplateRef<{ $implicit: AuditEntry }>
  @ViewChild('entityTpl', { static: true }) private entityTpl!: TemplateRef<{ $implicit: AuditEntry }>
  @ViewChild('statusTpl', { static: true }) private statusTpl!: TemplateRef<{ $implicit: AuditEntry }>
  @ViewChild('payloadTpl', { static: true }) private payloadTpl!: TemplateRef<{ $implicit: AuditEntry }>

  protected readonly methodOptions: { value: AuditMethod | ''; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'PATCH', label: 'PATCH' },
    { value: 'DELETE', label: 'DELETE' },
  ]

  protected readonly entityOptions: { value: AuditEntity | ''; label: string }[] = [
    { value: '', label: 'Todas' },
    { value: 'vehicle', label: 'Veículo' },
    { value: 'brand', label: 'Marca' },
    { value: 'model', label: 'Modelo' },
    { value: 'operation', label: 'Operação' },
    { value: 'auth', label: 'Auth' },
  ]

  readonly columns = computed<TableColumn<AuditEntry>[]>(() => [
    { key: 'timestamp', label: 'Data/Hora', cellTemplate: this.timestampTpl, width: '160px' },
    { key: 'user', label: 'Usuário', width: '130px' },
    { key: 'method', label: 'Método', cellTemplate: this.methodTpl, width: '90px' },
    { key: 'entity', label: 'Entidade', cellTemplate: this.entityTpl, width: '110px' },
    { key: 'endpoint', label: 'Endpoint', render: (e) => e.endpoint },
    { key: 'response_status', label: 'Status', cellTemplate: this.statusTpl, width: '80px' },
    { key: 'payload', label: 'Payload', cellTemplate: this.payloadTpl, width: '80px' },
  ])

  readonly expandedEntry = computed(() => {
    const id = this.store.expandedEntryId()
    if (!id) return null
    return this.store.entries().find(e => e.id === id) ?? null
  })

  private userDebounce: ReturnType<typeof setTimeout> | null = null

  ngOnInit(): void {
    this.store.loadEntries()
  }

  ngOnDestroy(): void {
    if (this.userDebounce) clearTimeout(this.userDebounce)
  }

  protected onUserSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    if (this.userDebounce) clearTimeout(this.userDebounce)
    this.userDebounce = setTimeout(() => {
      this.store.applyFilter({ user: value || undefined })
    }, 400)
  }

  protected onMethodChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as AuditMethod | ''
    this.store.applyFilter({ method: value || undefined })
  }

  protected onEntityChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as AuditEntity | ''
    this.store.applyFilter({ entity: value || undefined })
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

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  protected methodBadgeVariant(method: AuditMethod): BadgeVariant {
    const map: Record<AuditMethod, BadgeVariant> = {
      GET: 'neutral',
      POST: 'success',
      PATCH: 'info',
      DELETE: 'danger',
    }
    return map[method]
  }

  protected statusBadgeVariant(status: number): BadgeVariant {
    if (status >= 200 && status < 300) return 'success'
    if (status >= 400 && status < 500) return 'warning'
    if (status >= 500) return 'danger'
    return 'neutral'
  }
}

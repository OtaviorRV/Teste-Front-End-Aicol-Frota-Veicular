import { Injectable, computed, inject, signal } from '@angular/core'
import { DestroyRef } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AuditApiService } from '../services/audit-api.service'
import { AuditEntry, AuditFilters } from '../models/audit-entry.model'

@Injectable()
export class AuditStore {
  private readonly api = inject(AuditApiService)
  private readonly destroyRef = inject(DestroyRef)

  readonly entries = signal<AuditEntry[]>([])
  readonly total = signal(0)
  readonly loading = signal(false)
  readonly filters = signal<AuditFilters>({ page: 1, page_size: 20 })
  readonly expandedEntryId = signal<string | null>(null)

  readonly isEmpty = computed(() => this.entries().length === 0)
  readonly hasActiveFilters = computed(() =>
    !!this.filters().user ||
    !!this.filters().method ||
    !!this.filters().entity ||
    !!this.filters().date_from ||
    !!this.filters().date_to
  )

  loadEntries(filters?: Partial<AuditFilters>): void {
    if (filters) this.filters.update(f => ({ ...f, ...filters }))
    this.loading.set(true)
    this.api
      .getAll(this.filters())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data, total }) => {
          this.entries.set(data)
          this.total.set(total)
          this.loading.set(false)
        },
        error: () => this.loading.set(false),
      })
  }

  applyFilter(partial: Partial<AuditFilters>): void {
    this.filters.update(f => ({ ...f, page: 1, ...partial }))
    this.loadEntries()
  }

  toggleExpand(id: string): void {
    this.expandedEntryId.update(current => (current === id ? null : id))
  }
}

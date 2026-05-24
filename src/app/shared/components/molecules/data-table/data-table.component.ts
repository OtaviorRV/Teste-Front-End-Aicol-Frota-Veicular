import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
} from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import { TableColumn } from './table-column.model'

@Component({
  selector: 'app-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `
    <div class="w-full overflow-x-auto rounded-[5px] border border-border">
      <table class="w-full border-collapse text-[13px]">

        <thead class="sticky top-0 z-10 bg-surface-base">
          <tr>
            @if (selectable()) {
              <th class="w-10 px-3 py-2 text-left">
                <input
                  type="checkbox"
                  [checked]="allSelected()"
                  [indeterminate]="someSelected()"
                  (change)="toggleAll()"
                  class="cursor-pointer accent-brand-500"
                  aria-label="Selecionar todos"
                />
              </th>
            }
            @for (col of columns(); track col.key) {
              <th
                [style.width]="col.width ?? 'auto'"
                class="px-[14px] py-[10px] text-left text-[11.5px] font-medium uppercase tracking-[0.04em] text-subtle"
              >
                @if (col.headerTemplate) {
                  <ng-container [ngTemplateOutlet]="col.headerTemplate" />
                } @else {
                  {{ col.label }}
                }
              </th>
            }
          </tr>
        </thead>

        <tbody>
          @if (loading()) {
            @for (i of ghostRows(); track i) {
              <tr class="border-t border-border">
                @if (selectable()) {
                  <td class="px-3 py-[10px]">
                    <div class="h-4 w-4 animate-pulse rounded bg-surface-elevated"></div>
                  </td>
                }
                @for (col of columns(); track col.key) {
                  <td class="px-[14px] py-[10px]">
                    <div class="h-[14px] animate-pulse rounded bg-surface-elevated"
                         [style.width]="col.width ?? '80%'">
                    </div>
                  </td>
                }
              </tr>
            }
          } @else if (rows().length === 0) {
            <tr>
              <td [attr.colspan]="columnSpan()" class="px-[14px] py-8 text-center text-muted">
                @if (emptyTemplate()) {
                  <ng-container [ngTemplateOutlet]="emptyTemplate()!" />
                } @else {
                  Nenhum resultado encontrado.
                }
              </td>
            </tr>
          } @else {
            @for (row of rows(); track row.id) {
              <tr
                class="border-t border-border transition-colors duration-[70ms] hover:bg-surface-elevated"
                [class.bg-brand-soft]="selectedIds().has(row.id)"
              >
                @if (selectable()) {
                  <td class="px-3 py-[10px]">
                    <input
                      type="checkbox"
                      [checked]="selectedIds().has(row.id)"
                      (change)="toggleRow(row.id)"
                      class="cursor-pointer accent-brand-500"
                      [attr.aria-label]="'Selecionar linha ' + row.id"
                    />
                  </td>
                }
                @for (col of columns(); track col.key) {
                  <td [class]="getCellClass($first, col)">
                    @if (col.cellTemplate) {
                      <div [class.flex]="col.action" [class.justify-end]="col.action">
                        <ng-container
                          [ngTemplateOutlet]="col.cellTemplate"
                          [ngTemplateOutletContext]="{ $implicit: row }"
                        />
                      </div>
                    } @else if (col.render) {
                      {{ col.render(row) }}
                    } @else {
                      {{ getCell(row, col.key) }}
                    }
                  </td>
                }
              </tr>
            }
          }
        </tbody>

      </table>
    </div>
  `,
})
export class DataTableComponent<T extends { id: string }> {
  readonly rows         = input<T[]>([])
  readonly columns      = input<TableColumn<T>[]>([])
  readonly loading      = input(false, { transform: booleanAttribute })
  readonly ghostCount   = input(3)
  readonly selectable   = input(false, { transform: booleanAttribute })
  readonly emptyTemplate = input<TemplateRef<void> | null>(null)

  readonly rowAction       = output<{ action: string; row: T }>()
  readonly selectionChange = output<Set<string>>()

  readonly selectedIds = signal<Set<string>>(new Set())

  readonly allSelected = computed(() =>
    this.rows().length > 0 && this.rows().every(r => this.selectedIds().has(r.id))
  )

  readonly someSelected = computed(() =>
    !this.allSelected() && this.selectedIds().size > 0
  )

  protected readonly ghostRows = computed(() =>
    Array.from({ length: this.ghostCount() }, (_, i) => i)
  )

  protected readonly columnSpan = computed(() =>
    this.columns().length + (this.selectable() ? 1 : 0)
  )

  protected getCell(row: T, key: keyof T | string): unknown {
    return (row as Record<string, unknown>)[key as string]
  }

  protected getCellClass(isFirst: boolean, col: TableColumn<T>): string {
    const base = 'px-[14px] py-[10px] align-middle border-b border-border'
    const sticky = isFirst && !this.selectable()
      ? 'sticky left-0 bg-surface-base z-[1]'
      : ''
    return [base, sticky].filter(Boolean).join(' ')
  }

  protected toggleRow(id: string): void {
    this.selectedIds.update(current => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    this.selectionChange.emit(new Set(this.selectedIds()))
  }

  protected toggleAll(): void {
    const allIds = this.rows().map(r => r.id)
    const next = this.allSelected()
      ? new Set<string>()
      : new Set(allIds)
    this.selectedIds.set(next)
    this.selectionChange.emit(new Set(next))
  }
}

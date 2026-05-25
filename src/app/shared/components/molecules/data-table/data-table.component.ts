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
    <div class="w-full overflow-x-auto rounded-[5px]" [class.border]="!noBorder()" [class.border-border]="!noBorder()">
      <table class="w-full border-collapse text-[13px]">

        <thead class="sticky top-0 z-10 bg-surface-raised">
          <tr>
            @if (selectable()) {
              <th class="w-10 px-3 py-2.5 border-b border-border text-left">
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
                class="px-3.5 py-2.5 text-[11.5px] font-[550] uppercase tracking-[0.04em] text-subtle border-b border-border"
                [class.text-left]="!col.align || col.align === 'left'"
                [class.text-center]="col.align === 'center'"
                [class.text-right]="col.align === 'right'"
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
            @for (i of ghostRows(); track i; let isLastRow = $last) {
              <tr>
                @if (selectable()) {
                  <td [class]="isLastRow ? 'px-3 py-2.5 align-middle' : 'px-3 py-2.5 align-middle border-b border-border'">
                    <div class="skeleton h-4 w-4"></div>
                  </td>
                }
                @for (col of columns(); track col.key) {
                  <td [class]="isLastRow ? 'px-3.5 py-2.5' : 'px-3.5 py-2.5 border-b border-border'">
                    <div class="skeleton h-[14px]"
                         [style.width]="col.width ?? '80%'">
                    </div>
                  </td>
                }
              </tr>
            }
          } @else if (rows().length === 0) {
            <tr>
              <td [attr.colspan]="columnSpan()" class="px-3.5 py-8 text-center text-muted">
                @if (emptyTemplate()) {
                  <ng-container [ngTemplateOutlet]="emptyTemplate()!" />
                } @else {
                  Nenhum resultado encontrado.
                }
              </td>
            </tr>
          } @else {
            @for (row of rows(); track row.id; let isLastRow = $last) {
              <tr [class]="getRowClass(row)">
                @if (selectable()) {
                  <td [class]="getCheckboxCellClass(isLastRow)">
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
                  <td [class]="getCellClass(isLastRow, col)">
                    @if (col.cellTemplate) {
                      <div [class]="col.action ? 'flex items-center justify-end gap-0.5' : ''">
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
  readonly rows          = input<T[]>([])
  readonly columns       = input<TableColumn<T>[]>([])
  readonly loading       = input(false, { transform: booleanAttribute })
  readonly ghostCount    = input(8)
  readonly selectable    = input(false, { transform: booleanAttribute })
  readonly noBorder      = input(false, { transform: booleanAttribute })
  readonly emptyTemplate = input<TemplateRef<void> | null>(null)

  readonly rowClass        = input<((row: T) => string) | null>(null)

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

  protected getRowClass(row: T): string {
    const base = 'transition-colors duration-[70ms] hover:bg-surface-elevated'
    const selected = this.selectedIds().has(row.id) ? 'bg-brand-soft' : ''
    const extra = this.rowClass()?.(row) ?? ''
    return [base, selected, extra].filter(Boolean).join(' ')
  }

  protected getCellClass(isLast: boolean, col: TableColumn<T>): string {
    const border = isLast ? '' : 'border-b border-border'
    const align = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
    const extra = col.cellClass ?? ''
    return ['px-3.5 py-2.5 align-middle', border, align, extra].filter(Boolean).join(' ')
  }

  protected getCheckboxCellClass(isLast: boolean): string {
    return ['px-3 py-2.5 align-middle', isLast ? '' : 'border-b border-border'].filter(Boolean).join(' ')
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

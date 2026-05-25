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
    <div class="table-wrap">
      <table class="data">

        <thead>
          <tr>
            @if (selectable()) {
              <th style="width:40px">
                <input
                  type="checkbox"
                  [checked]="allSelected()"
                  [indeterminate]="someSelected()"
                  (change)="toggleAll()"
                  aria-label="Selecionar todos"
                />
              </th>
            }
            @for (col of columns(); track col.key) {
              <th [style.width]="col.width ?? 'auto'" [class]="thClass(col)">
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
              <tr>
                @if (selectable()) {
                  <td><div class="skeleton" style="height:14px;width:14px"></div></td>
                }
                @for (col of columns(); track col.key) {
                  <td>
                    <div class="skeleton" style="height:14px" [style.width]="col.width ? '60%' : '80%'"></div>
                  </td>
                }
              </tr>
            }
          } @else if (rows().length === 0) {
            <tr>
              <td [attr.colspan]="columnSpan()" style="text-align:center;padding:0">
                @if (emptyTemplate()) {
                  <ng-container [ngTemplateOutlet]="emptyTemplate()!" />
                } @else {
                  <span style="color:var(--text-muted)">Nenhum resultado encontrado.</span>
                }
              </td>
            </tr>
          } @else {
            @for (row of rows(); track row.id) {
              <tr [class]="getRowClass(row)">
                @if (selectable()) {
                  <td>
                    <input
                      type="checkbox"
                      [checked]="selectedIds().has(row.id)"
                      (change)="toggleRow(row.id)"
                      [attr.aria-label]="'Selecionar linha ' + row.id"
                    />
                  </td>
                }
                @for (col of columns(); track col.key) {
                  <td [class]="getCellClass(col)">
                    @if (col.cellTemplate) {
                      <ng-container
                        [ngTemplateOutlet]="col.cellTemplate"
                        [ngTemplateOutletContext]="{ $implicit: row }"
                      />
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
  readonly rowClass      = input<((row: T) => string) | null>(null)

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
    const selected = this.selectedIds().has(row.id) ? 'row-selected' : ''
    const extra = this.rowClass()?.(row) ?? ''
    return [selected, extra].filter(Boolean).join(' ')
  }

  protected getCellClass(col: TableColumn<T>): string {
    const align = col.align === 'right' ? 'col-right' : col.align === 'center' ? 'col-center' : ''
    const extra = col.cellClass ?? ''
    return [align, extra].filter(Boolean).join(' ')
  }

  protected thClass(col: TableColumn<T>): string {
    return col.align === 'right' ? 'col-right' : col.align === 'center' ? 'col-center' : ''
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
    const next = this.allSelected() ? new Set<string>() : new Set(allIds)
    this.selectedIds.set(next)
    this.selectionChange.emit(new Set(next))
  }
}

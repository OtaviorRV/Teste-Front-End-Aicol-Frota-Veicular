import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core'
import { IconComponent } from '../../atoms/icon/icon.component'

@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    @if (total() > 0) {
      <div class="pagination">

        <span>
          Exibindo
          <strong class="fw-600" style="color:var(--text)">{{ from() }}–{{ to() }}</strong>
          de
          <strong class="fw-600" style="color:var(--text)">{{ total() }}</strong>
        </span>

        <div class="controls">
          <button
            type="button"
            class="btn icon"
            [disabled]="page() <= 1"
            (click)="pageChange.emit(page() - 1)"
            aria-label="Página anterior"
          >
            <app-icon name="chevronL" size="sm" />
          </button>

          <span style="padding:0 8px;font-variant-numeric:tabular-nums">
            Página {{ page() }} de {{ totalPages() }}
          </span>

          <button
            type="button"
            class="btn icon"
            [disabled]="page() >= totalPages()"
            (click)="pageChange.emit(page() + 1)"
            aria-label="Próxima página"
          >
            <app-icon name="chevronR" size="sm" />
          </button>
        </div>

      </div>
    }
  `,
})
export class PaginationComponent {
  readonly total    = input.required<number>()
  readonly page     = input.required<number>()
  readonly pageSize = input.required<number>()

  readonly pageChange = output<number>()

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize()))
  )

  protected readonly from = computed(() =>
    (this.page() - 1) * this.pageSize() + 1
  )

  protected readonly to = computed(() =>
    Math.min(this.page() * this.pageSize(), this.total())
  )
}

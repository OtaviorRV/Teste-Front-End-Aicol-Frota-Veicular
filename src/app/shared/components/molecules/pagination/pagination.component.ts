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
      <div class="flex items-center justify-between text-[12px] text-muted">

        <span>
          Exibindo
          <strong class="font-[600] text-text">{{ from() }}–{{ to() }}</strong>
          de
          <strong class="font-[600] text-text">{{ total() }}</strong>
        </span>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-[4px] border border-border bg-surface text-muted transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
            [disabled]="page() <= 1"
            (click)="pageChange.emit(page() - 1)"
            aria-label="Página anterior"
          >
            <app-icon name="chevronL" size="sm" />
          </button>

          <span class="px-2 tabular-nums">
            Página {{ page() }} de {{ totalPages() }}
          </span>

          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-[4px] border border-border bg-surface text-muted transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
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

import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core'
import { IconComponent, IconName } from '../icon/icon.component'

@Component({
  selector: 'app-icon-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-[4px] text-muted transition-colors hover:bg-surface-raised hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
      [class]="sizeClass()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
      (click)="clicked.emit()"
    >
      <app-icon [name]="icon()" [size]="iconSize()" />
    </button>
  `,
})
export class IconButtonComponent {
  readonly icon      = input.required<IconName>()
  readonly size      = input<'sm' | 'md' | 'lg'>('md')
  readonly disabled  = input(false, { transform: booleanAttribute })
  readonly ariaLabel = input('')

  readonly clicked = output<void>()

  protected readonly sizeClass = computed(() =>
    ({ sm: 'h-6 w-6', md: 'h-7 w-7', lg: 'h-8 w-8' }[this.size()])
  )

  protected readonly iconSize = computed(() =>
    ({ sm: 'xs', md: 'sm', lg: 'md' } as const)[this.size()]
  )
}

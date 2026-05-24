import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core'

@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading() || null"
      [class]="buttonClass()"
      (click)="clicked.emit($event)"
    >
      @if (loading()) {
        <span
          class="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        ></span>
      }
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'ghost' | 'danger'>('secondary')
  readonly size = input<'sm' | 'md' | 'lg'>('md')
  readonly loading = input(false)
  readonly disabled = input(false)
  readonly block = input(false)
  readonly type = input<'button' | 'submit' | 'reset'>('button')

  readonly clicked = output<MouseEvent>()

  protected readonly buttonClass = computed(() => {
    const base = [
      'inline-flex items-center gap-1.5 rounded-[5px] border font-medium',
      'transition-colors cursor-pointer select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
      'disabled:pointer-events-none disabled:opacity-50',
      this.block() ? 'w-full justify-center' : 'justify-start',
    ].join(' ')

    const variantClass: Record<'primary' | 'secondary' | 'ghost' | 'danger', string> = {
      primary:   'bg-brand-500 border-brand-500 text-on-accent hover:bg-brand-400 active:bg-brand-600',
      secondary: 'bg-surface-raised border-border-strong text-text hover:bg-surface-elevated',
      ghost:     'bg-transparent border-transparent text-muted hover:text-text hover:bg-surface-raised',
      danger:    'bg-danger border-danger text-white hover:opacity-90 active:opacity-100',
    }

    const sizeClass: Record<'sm' | 'md' | 'lg', string> = {
      sm: 'h-[26px] px-2.5 text-[12.5px]',
      md: 'h-[30px] px-3   text-[12.5px]',
      lg: 'h-[36px] px-4   text-sm',
    }

    return `${base} ${variantClass[this.variant()]} ${sizeClass[this.size()]}`
  })
}

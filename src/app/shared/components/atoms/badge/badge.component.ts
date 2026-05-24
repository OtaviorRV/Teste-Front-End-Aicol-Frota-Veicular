import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent' | 'outline'

@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'badgeClass()',
    role: 'status',
  },
  template: `
    @if (dot()) {
      <span class="inline-block h-[5px] w-[5px] shrink-0 rounded-full bg-current"></span>
    }
    {{ label() }}
  `,
})
export class BadgeComponent {
  readonly label   = input.required<string>()
  readonly variant = input<BadgeVariant>('neutral')
  readonly size    = input<'sm' | 'md'>('md')
  readonly dot     = input(false, { transform: booleanAttribute })

  protected readonly badgeClass = computed(() => {
    const base = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] font-[550]'

    const sizeMap: Record<'sm' | 'md', string> = {
      sm: 'px-[6px] py-[1px] text-[11px]',
      md: 'px-[8px] py-[2px] text-[11.5px]',
    }

    const variantMap: Record<BadgeVariant, string> = {
      success: 'bg-success-soft text-success-text',
      warning: 'bg-warning-soft text-warning-text',
      danger:  'bg-danger-soft  text-danger-text',
      info:    'bg-info-soft    text-info-text',
      neutral: 'bg-neutral-soft text-neutral-text',
      accent:  'bg-brand-soft   text-brand-soft-text',
      outline: 'bg-transparent border border-border-strong text-muted',
    }

    return `${base} ${sizeMap[this.size()]} ${variantMap[this.variant()]}`
  })
}

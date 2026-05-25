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
      <span class="dot"></span>
    }
    {{ label() }}
  `,
})
export class BadgeComponent {
  readonly label   = input.required<string>()
  readonly variant = input<BadgeVariant>('neutral')
  readonly dot     = input(false, { transform: booleanAttribute })

  protected readonly badgeClass = computed(() =>
    `badge ${this.variant()}`
  )
}

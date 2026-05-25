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
        <span class="spinner" aria-hidden="true"></span>
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
    const classes = ['btn', this.variant()]
    if (this.size() !== 'md') classes.push(this.size())
    if (this.block()) classes.push('block')
    return classes.join(' ')
  })
}

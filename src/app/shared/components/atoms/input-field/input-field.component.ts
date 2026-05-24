import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  signal,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'

@Component({
  selector: 'app-input-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputFieldComponent,
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-1">
      @if (label()) {
        <label [for]="inputId" class="text-[12px] font-medium text-text leading-none">
          {{ label() }}
          @if (required()) {
            <span class="ml-0.5 text-danger" aria-hidden="true">*</span>
          }
        </label>
      }

      <div class="relative flex items-center">
        @if (hasLeading()) {
          <div class="pointer-events-none absolute left-2 flex items-center text-muted">
            <ng-content select="[leadingIcon]" />
          </div>
        }

        <input
          [id]="inputId"
          [type]="type()"
          [placeholder]="placeholder()"
          [disabled]="innerDisabled()"
          [value]="innerValue()"
          [attr.aria-invalid]="error() ? true : null"
          [attr.aria-describedby]="error() ? errorId : null"
          [class]="inputClass()"
          (input)="onInput($event)"
          (blur)="onBlur()"
        />

        @if (pending()) {
          <div class="absolute right-2 flex items-center">
            <span
              class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted border-t-transparent"
              aria-hidden="true"
            ></span>
          </div>
        } @else {
          <div class="absolute right-0 flex items-center">
            <ng-content select="[trailingButton]" />
          </div>
        }
      </div>

      @if (error()) {
        <p [id]="errorId" class="text-[11.5px] text-danger leading-none" role="alert">
          {{ error() }}
        </p>
      }
    </div>
  `,
})
export class InputFieldComponent implements ControlValueAccessor {
  private static nextId = 0

  protected readonly inputId = `input-field-${++InputFieldComponent.nextId}`
  protected readonly errorId = `${this.inputId}-error`

  readonly label       = input<string>('')
  readonly error       = input<string | null>(null)
  readonly type        = input<string>('text')
  readonly placeholder = input<string>('')
  readonly pending     = input(false, { transform: booleanAttribute })
  readonly required    = input(false, { transform: booleanAttribute })
  readonly hasLeading  = input(false, { transform: booleanAttribute })

  protected readonly innerValue    = signal('')
  protected readonly innerDisabled = signal(false)

  private onChange: (v: string) => void = () => {}
  private onTouched: () => void = () => {}

  protected readonly inputClass = computed(() => {
    const base = [
      'w-full h-[32px] rounded-[5px] border bg-surface-raised',
      'text-[13px] text-text placeholder:text-muted',
      'transition-colors outline-none',
      'focus:border-border-focus focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-sunken',
      this.hasLeading() ? 'pl-8'   : 'pl-2.5',
      this.pending()    ? 'pr-8'   : 'pr-2.5',
    ]

    const borderClass = this.error()
      ? 'border-danger shadow-[0_0_0_3px_rgba(239,68,68,0.10)]'
      : 'border-border-strong'

    return [...base, borderClass].join(' ')
  })

  writeValue(v: string): void {
    this.innerValue.set(v ?? '')
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(disabled: boolean): void {
    this.innerDisabled.set(disabled)
  }

  protected onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value
    this.innerValue.set(v)
    this.onChange(v)
  }

  protected onBlur(): void {
    this.onTouched()
  }
}

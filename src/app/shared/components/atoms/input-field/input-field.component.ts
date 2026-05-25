import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
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
    <div class="field">
      @if (label()) {
        <label [for]="inputId" class="field-label">
          {{ label() }}
          @if (required()) {
            <span class="req" aria-hidden="true">*</span>
          }
        </label>
      }

      @if (hasLeading()) {
        <div class="input-group">
          <ng-content select="[leadingIcon]" />
          <input
            [id]="inputId"
            [type]="type()"
            [placeholder]="placeholder()"
            [disabled]="innerDisabled()"
            [value]="innerValue()"
            [attr.autocomplete]="autocomplete() || null"
            [attr.aria-invalid]="error() ? true : null"
            [attr.aria-describedby]="error() ? errorId : null"
            class="input"
            [class.has-error]="!!error()"
            (input)="onInput($event)"
            (blur)="onBlur()"
          />
          <ng-content select="[trailingButton]" />
        </div>
      } @else {
        <input
          [id]="inputId"
          [type]="type()"
          [placeholder]="placeholder()"
          [disabled]="innerDisabled()"
          [value]="innerValue()"
          [attr.autocomplete]="autocomplete() || null"
          [attr.aria-invalid]="error() ? true : null"
          [attr.aria-describedby]="error() ? errorId : null"
          class="input"
          [class.has-error]="!!error()"
          (input)="onInput($event)"
          (blur)="onBlur()"
        />
      }

      @if (pending()) {
        <div class="field-help">Verificando…</div>
      } @else if (error()) {
        <p [id]="errorId" class="field-error" role="alert">{{ error() }}</p>
      }
    </div>
  `,
})
export class InputFieldComponent implements ControlValueAccessor {
  private static nextId = 0

  protected readonly inputId = `input-field-${++InputFieldComponent.nextId}`
  protected readonly errorId = `${this.inputId}-error`

  readonly label        = input<string>('')
  readonly error        = input<string | null>(null)
  readonly type         = input<string>('text')
  readonly placeholder  = input<string>('')
  readonly autocomplete = input<string>('')
  readonly pending      = input(false, { transform: booleanAttribute })
  readonly required     = input(false, { transform: booleanAttribute })
  readonly hasLeading   = input(false, { transform: booleanAttribute })
  readonly hasTrailing  = input(false, { transform: booleanAttribute })

  protected readonly innerValue    = signal('')
  protected readonly innerDisabled = signal(false)

  private onChange: (v: string) => void = () => {}
  private onTouched: () => void = () => {}

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

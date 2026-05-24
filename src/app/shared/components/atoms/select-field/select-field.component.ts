import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import {
  BrnSelectComponent,
  BrnSelectImports,
} from '@spartan-ng/ui-select-brain'
import { SelectOption } from './select-option.model'

@Component({
  selector: 'app-select-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BrnSelectImports],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SelectFieldComponent,
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-1">
      @if (label()) {
        <label class="text-[12px] font-medium text-text leading-none">
          {{ label() }}
          @if (required()) {
            <span class="ml-0.5 text-danger" aria-hidden="true">*</span>
          }
        </label>
      }

      <brn-select
        [placeholder]="placeholder()"
        [disabled]="disabled() || innerDisabled()"
      >
        <button
          brnSelectTrigger
          type="button"
          [class]="triggerClass()"
        >
          <brn-select-value class="truncate text-left" />
          <svg
            class="ml-auto h-3.5 w-3.5 shrink-0 text-muted"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
          </svg>
        </button>

        <brn-select-content class="z-50 min-w-[8rem] overflow-hidden rounded-[5px] border border-border bg-surface-raised shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          @for (option of options(); track option.value) {
            <div
              brnOption
              [value]="option.value"
              [disabled]="option.disabled ?? false"
              class="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-[4px] px-[10px] py-[7px] text-[13px] text-text outline-none transition-colors duration-[70ms] hover:bg-surface-elevated data-[state=checked]:bg-brand-soft data-[state=checked]:text-brand-soft-text data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
            >
              @if (option.variant) {
                <span [class]="badgeClass(option.variant)">{{ option.label }}</span>
              } @else {
                {{ option.label }}
              }
            </div>
          }
        </brn-select-content>
      </brn-select>

      @if (error()) {
        <p class="text-[11.5px] text-danger leading-none" role="alert">
          {{ error() }}
        </p>
      }
    </div>
  `,
})
export class SelectFieldComponent implements ControlValueAccessor, AfterViewInit {
  private readonly brnSelect = viewChild<BrnSelectComponent<string>>(BrnSelectComponent)

  readonly label       = input<string>('')
  readonly options     = input<SelectOption[]>([])
  readonly error       = input<string | null>(null)
  readonly placeholder = input<string>('Selecione...')
  readonly required    = input(false, { transform: booleanAttribute })
  readonly disabled    = input(false, { transform: booleanAttribute })

  protected readonly innerDisabled = signal(false)

  private pendingValue: string | null = null
  private onChange: (v: string) => void = () => {}
  private onTouched: () => void = () => {}

  protected readonly triggerClass = computed(() => {
    const base = [
      'flex h-[32px] w-full items-center justify-between rounded-[5px] border',
      'bg-surface-raised px-[10px] text-[13px] text-text',
      'transition-[border-color,box-shadow] duration-[80ms] outline-none',
      'focus-visible:border-border-focus focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-sunken',
    ]

    const borderClass = this.error()
      ? 'border-danger shadow-[0_0_0_3px_rgba(239,68,68,0.10)]'
      : 'border-border-strong'

    return [...base, borderClass].join(' ')
  })

  protected badgeClass(variant: NonNullable<SelectOption['variant']>): string {
    const map: Record<NonNullable<SelectOption['variant']>, string> = {
      success: 'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-success-soft text-success-text',
      warning: 'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-warning-soft text-warning-text',
      danger:  'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-danger-soft  text-danger-text',
      info:    'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-info-soft    text-info-text',
      neutral: 'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-neutral-soft text-neutral-text',
    }
    return map[variant]
  }

  ngAfterViewInit(): void {
    const select = this.brnSelect()
    if (!select) return
    select.registerOnChange((v: string) => {
      this.onChange(v)
      this.onTouched()
    })
    if (this.pendingValue !== null) {
      select.writeValue(this.pendingValue)
      this.pendingValue = null
    }
  }

  writeValue(v: string): void {
    const select = this.brnSelect()
    if (select) {
      select.writeValue(v ?? '')
    } else {
      this.pendingValue = v ?? ''
    }
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(disabled: boolean): void {
    this.innerDisabled.set(disabled)
    this.brnSelect()?.setDisabledState(disabled)
  }
}

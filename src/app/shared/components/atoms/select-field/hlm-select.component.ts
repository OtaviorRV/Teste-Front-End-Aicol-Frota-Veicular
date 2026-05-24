import { ChangeDetectionStrategy, Component, forwardRef, input, output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  BrnSelectComponent,
  BrnSelectContentComponent,
  BrnSelectImports,
  BrnSelectOptionDirective,
  BrnSelectTriggerDirective,
  BrnSelectValueComponent,
} from '@spartan-ng/ui-select-brain';

export interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'hlm-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BrnSelectImports],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HlmSelectComponent),
      multi: true,
    },
  ],
  template: `
    <brn-select [placeholder]="placeholder()" [disabled]="disabled()" (valueChange)="onValueChange($event)">
      <button
        brnSelectTrigger
        class="flex h-8 w-full items-center justify-between rounded-[5px] border border-[var(--border-strong)] bg-[var(--bg-raised)] px-[10px] text-[13px] text-[var(--text)] transition-[border-color,box-shadow] duration-[80ms] focus-visible:border-[var(--border-focus)] focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] disabled:cursor-not-allowed disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-muted)]"
        type="button"
      >
        <brn-select-value class="truncate" />
        <svg class="ml-2 h-3.5 w-3.5 shrink-0 text-[var(--text-subtle)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </button>

      <brn-select-content
        class="z-50 min-w-[8rem] overflow-hidden rounded-[5px] border border-[var(--border)] bg-[var(--bg-raised)] shadow-[var(--shadow-md)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        @for (option of options(); track option.value) {
          <div
            brnSelectOption
            [value]="option.value"
            class="relative flex w-full cursor-pointer select-none items-center rounded-[4px] px-[10px] py-[7px] text-[13px] text-[var(--text)] outline-none transition-colors duration-[70ms] hover:bg-[var(--bg-elevated)] data-[state=checked]:bg-[var(--accent-soft)] data-[state=checked]:text-[var(--accent-soft-text)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
          >
            {{ option.label }}
          </div>
        }
      </brn-select-content>
    </brn-select>
  `,
})
export class HlmSelectComponent implements ControlValueAccessor {
  readonly placeholder = input('Selecionar...');
  readonly options = input<SelectOption[]>([]);
  readonly disabled = input(false);
  readonly valueChange = output<string>();

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  onValueChange(value: string): void {
    this.onChange(value);
    this.onTouched();
    this.valueChange.emit(value);
  }

  writeValue(): void {}
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
}

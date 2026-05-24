import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog'
import { ButtonComponent } from '../../atoms/button/button.component'
import { ConfirmOptions } from '../../../../core/dialog/dialog.service'

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <div class="flex flex-col rounded-[8px] border border-border bg-surface-raised shadow-[var(--shadow-overlay)] max-h-[90vh] w-full overflow-hidden">

      <div class="px-5 pb-1 pt-4">
        <h2 class="text-[15px] font-semibold text-text leading-snug">
          {{ data.title }}
        </h2>
      </div>

      <div class="px-5 py-3">
        <p class="text-[13px] text-muted leading-relaxed">{{ data.message }}</p>
      </div>

      <div class="flex items-center justify-end gap-2 border-t border-border bg-surface-elevated px-5 py-3">
        <app-button
          variant="secondary"
          size="sm"
          (clicked)="cancel()"
        >
          {{ data.cancelLabel ?? 'Cancelar' }}
        </app-button>

        <app-button
          [variant]="data.variant === 'danger' ? 'danger' : 'primary'"
          size="sm"
          (clicked)="confirm()"
        >
          {{ data.confirmLabel ?? 'Confirmar' }}
        </app-button>
      </div>

    </div>
  `,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmOptions>(DIALOG_DATA)
  private readonly dialogRef = inject<DialogRef<'confirmed' | 'cancelled'>>(DialogRef)

  protected confirm(): void {
    this.dialogRef.close('confirmed')
  }

  protected cancel(): void {
    this.dialogRef.close('cancelled')
  }
}

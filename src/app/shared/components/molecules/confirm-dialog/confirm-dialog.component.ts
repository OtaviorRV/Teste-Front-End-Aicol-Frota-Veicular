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
    <div class="dialog">

      <div class="dialog-header">
        <h2 class="dialog-title">{{ data.title }}</h2>
      </div>

      <div class="dialog-body">
        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.55">{{ data.message }}</p>
      </div>

      <div class="dialog-footer">
        <app-button variant="secondary" size="sm" (clicked)="cancel()">
          {{ data.cancelLabel ?? 'Cancelar' }}
        </app-button>
        <app-button [variant]="data.variant === 'danger' ? 'danger' : 'primary'" size="sm" (clicked)="confirm()">
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

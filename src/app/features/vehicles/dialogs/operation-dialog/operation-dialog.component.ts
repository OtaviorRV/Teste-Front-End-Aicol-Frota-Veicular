import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog'
import { Vehicle } from '../../models/vehicle.model'
import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component'

export interface OperationDialogData {
  vehicle: Vehicle
}

@Component({
  selector: 'app-operation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <div class="flex flex-col rounded-[8px] border border-border bg-surface-raised shadow-[var(--shadow-overlay)] w-full overflow-hidden">
      <div class="px-5 pt-4 pb-1">
        <h2 class="text-[15px] font-semibold text-text">Registrar Operação</h2>
      </div>
      <div class="px-5 py-3">
        <p class="text-[13px] text-muted">Veículo: <span class="text-text font-medium">{{ data.vehicle.license_plate }}</span></p>
        <p class="mt-3 text-[13px] text-muted">Funcionalidade implementada em ticket futuro.</p>
      </div>
      <div class="flex justify-end border-t border-border bg-surface-elevated px-5 py-3">
        <app-button size="sm" (clicked)="close()">Fechar</app-button>
      </div>
    </div>
  `,
})
export class OperationDialogComponent {
  protected readonly data = inject<OperationDialogData>(DIALOG_DATA)
  private readonly dialogRef = inject<DialogRef<'registered' | 'cancelled'>>(DialogRef)

  close(): void {
    this.dialogRef.close('cancelled')
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { HttpErrorResponse } from '@angular/common/http'
import { finalize } from 'rxjs'
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog'
import { OperationType, Vehicle, VehicleStatus } from '../../models/vehicle.model'
import { AuthStore } from '../../../../core/auth/auth.store'
import { HistoryStore } from '../../../history/store/history.store'
import { CreateOperationDto } from '../../../history/models/history.models'
import { BadgeComponent } from '../../../../shared/components/atoms/badge/badge.component'
import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component'
import {
  ALLOWED_OPERATIONS,
  NEXT_STATUS,
  OPERATION_LABEL,
  formatKm,
  formatPlate,
  vehicleStatusLabel,
  vehicleStatusVariant,
} from '../../utils/vehicle.utils'

export interface OperationDialogData {
  vehicle: Vehicle
}

@Component({
  selector: 'app-operation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent, ButtonComponent],
  template: `
    <div class="dialog" style="max-width:480px;width:100%">

      <div class="dialog-header">
        <div class="dialog-title">Registrar operação</div>
        <div class="dialog-subtitle">
          Veículo {{ formatPlate(vehicle.license_plate, '-') }}
          · {{ vehicle.brand_name }} {{ vehicle.model_name }}
        </div>
      </div>

      <div class="dialog-body">

        @if (allowedOps().length === 0) {
          <div class="alert info">
            <svg style="width:14px;height:14px;flex-shrink:0" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="1.7"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>Veículos neste status não aceitam novas operações.</div>
          </div>
        } @else {
          <div style="display:flex;flex-direction:column;gap:14px">

            <!-- Status preview -->
            <div style="display:flex;gap:12px;align-items:center;padding:10px 12px;
                        background:var(--bg-elevated);border:1px solid var(--border);border-radius:6px">
              <div>
                <div style="font-size:11.5px;color:var(--text-subtle);margin-bottom:2px">Status atual</div>
                <app-badge
                  [label]="vehicleStatusLabel(vehicle.status)"
                  [variant]="vehicleStatusVariant(vehicle.status)"
                  [dot]="true"
                />
              </div>

              @if (previewStatus() && previewStatus() !== vehicle.status) {
                <svg style="width:14px;height:14px;color:var(--text-subtle);flex-shrink:0"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
                <div>
                  <div style="font-size:11.5px;color:var(--text-subtle);margin-bottom:2px">Novo status</div>
                  <app-badge
                    [label]="vehicleStatusLabel(previewStatus()!)"
                    [variant]="vehicleStatusVariant(previewStatus()!)"
                    [dot]="true"
                  />
                </div>
              }

              <div style="margin-left:auto;text-align:right">
                <div style="font-size:11.5px;color:var(--text-subtle)">Último odômetro</div>
                <div class="mono" style="font-size:12.5px;font-weight:600">
                  {{ formatKm(vehicle.last_odometer_km) }}
                </div>
              </div>
            </div>

            <!-- Tipo de operação -->
            <div class="field">
              <label class="field-label">
                Tipo de operação <span class="req">*</span>
              </label>
              <div class="select-wrap">
                <select
                  class="select"
                  [class.has-error]="submitted() && errors()['type']"
                  [value]="type()"
                  (change)="type.set($any($event.target).value)"
                >
                  <option value="">Selecione…</option>
                  @for (op of allowedOps(); track op) {
                    <option [value]="op">{{ opLabel(op) }}</option>
                  }
                </select>
              </div>
              @if (submitted() && errors()['type']) {
                <div class="field-error">{{ errors()['type'] }}</div>
              } @else {
                <div class="field-help">
                  Tipos permitidos para "{{ vehicleStatusLabel(vehicle.status) }}":
                  {{ allowedOpsLabels() }}
                </div>
              }
            </div>

            <!-- Odômetro (condicional) -->
            @if (acceptsOdometer()) {
              <div class="field">
                <label class="field-label">Odômetro (km)</label>
                <input
                  type="number"
                  class="input mono"
                  [class.has-error]="submitted() && errors()['odo']"
                  placeholder="0"
                  min="0"
                  [value]="odo()"
                  (input)="odo.set($any($event.target).value)"
                />
                @if (submitted() && errors()['odo']) {
                  <div class="field-error">{{ errors()['odo'] }}</div>
                } @else if (vehicle.last_odometer_km != null) {
                  <div class="field-help">
                    Último registrado: {{ formatKm(vehicle.last_odometer_km) }}
                  </div>
                } @else {
                  <div class="field-help">Nenhum odômetro registrado ainda</div>
                }
              </div>
            }

            <!-- Data prevista de devolução (condicional) -->
            @if (needsReturnDate()) {
              <div class="field">
                <label class="field-label">
                  Data prevista de devolução <span class="req">*</span>
                </label>
                <input
                  type="date"
                  class="input"
                  [class.has-error]="submitted() && errors()['retDate']"
                  [min]="today"
                  [value]="retDate()"
                  (input)="retDate.set($any($event.target).value)"
                />
                @if (submitted() && errors()['retDate']) {
                  <div class="field-error">{{ errors()['retDate'] }}</div>
                }
              </div>
            }

            <!-- Observações -->
            <div class="field">
              <label class="field-label">Observações</label>
              <textarea
                class="textarea"
                placeholder="Ex: Locação contrato #C-4830, devolução prevista para 12/06"
                maxlength="500"
                [value]="notes()"
                (input)="notes.set($any($event.target).value)"
              ></textarea>
              <div class="field-help">Opcional — contrato, motivo, contexto da operação</div>
            </div>

          </div>
        }
      </div>

      <div class="dialog-footer">
        <app-button variant="secondary" (clicked)="close()">Cancelar</app-button>
        @if (allowedOps().length > 0) {
          <app-button variant="primary" [loading]="saving()" [disabled]="saving()" (clicked)="submit()">Registrar operação</app-button>
        } @else {
          <app-button variant="primary" (clicked)="close()">Entendi</app-button>
        }
      </div>

    </div>
  `,
})
export class OperationDialogComponent {
  protected readonly data        = inject<OperationDialogData>(DIALOG_DATA)
  private  readonly dialogRef   = inject<DialogRef<'registered' | 'cancelled'>>(DialogRef)
  private  readonly historyStore = inject(HistoryStore)
  private  readonly authStore    = inject(AuthStore)
  private  readonly destroyRef   = inject(DestroyRef)

  readonly saving = signal(false)

  protected readonly vehicle = this.data.vehicle

  protected readonly formatPlate          = formatPlate
  protected readonly formatKm             = formatKm
  protected readonly vehicleStatusLabel   = vehicleStatusLabel
  protected readonly vehicleStatusVariant = vehicleStatusVariant
  protected readonly opLabel              = (t: OperationType) => OPERATION_LABEL[t]

  protected readonly today = new Date().toISOString().slice(0, 10)

  protected readonly type      = signal<OperationType | ''>('')
  protected readonly odo       = signal('')
  protected readonly retDate   = signal('')
  protected readonly notes     = signal('')
  protected readonly submitted = signal(false)

  protected readonly allowedOps = computed<OperationType[]>(
    () => ALLOWED_OPERATIONS[this.vehicle.status] ?? []
  )

  protected readonly allowedOpsLabels = computed(() =>
    this.allowedOps().map(t => OPERATION_LABEL[t]).join(', ')
  )

  protected readonly needsReturnDate = computed(() => this.type() === 'check_out')

  protected readonly acceptsOdometer = computed(() =>
    (['check_in', 'check_out', 'maintenance'] as OperationType[]).includes(
      this.type() as OperationType
    )
  )

  protected readonly previewStatus = computed<VehicleStatus | null>(() => {
    const t = this.type() as OperationType
    return t ? (NEXT_STATUS[t] ?? null) : null
  })

  protected readonly errors = computed<Record<string, string>>(() => {
    const errs: Record<string, string> = {}

    if (!this.type()) {
      errs['type'] = 'Selecione o tipo de operação'
    }

    if (this.needsReturnDate() && !this.retDate()) {
      errs['retDate'] = 'Data prevista de devolução é obrigatória'
    }

    if (this.acceptsOdometer() && this.odo() !== '') {
      const km = Number(this.odo())
      if (!Number.isFinite(km) || km < 0) {
        errs['odo'] = 'Valor inválido'
      } else if (this.vehicle.last_odometer_km != null && km < this.vehicle.last_odometer_km) {
        errs['odo'] = `Odômetro deve ser ≥ ao último registrado (${this.vehicle.last_odometer_km.toLocaleString('pt-BR')} km)`
      }
    }

    return errs
  })

  protected submit(): void {
    this.submitted.set(true)
    if (Object.keys(this.errors()).length > 0 || this.saving()) return

    const dto: CreateOperationDto = {
      vehicle_id:            this.vehicle.id,
      type:                  this.type() as OperationType,
      notes:                 this.notes().trim() || undefined,
      odometer_km:           this.odo() !== '' ? Number(this.odo()) : undefined,
      expected_return_date:  this.retDate() || undefined,
      created_by:            this.authStore.user()!.nickname,
    }

    this.saving.set(true)
    this.historyStore.registerOperation(dto).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: () => this.dialogRef.close('registered'),
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) this.dialogRef.close('cancelled')
      },
    })
  }

  protected close(): void {
    this.dialogRef.close('cancelled')
  }
}

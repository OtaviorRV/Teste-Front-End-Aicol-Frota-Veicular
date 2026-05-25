import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { Router } from '@angular/router'
import { filter, finalize, first, startWith } from 'rxjs/operators'

import { VehicleStore } from '../../store/vehicle.store'
import { VehicleApiService } from '../../services/vehicle-api.service'
import { CatalogStore } from '../../../catalog/store/catalog.store'
import { AuthStore } from '../../../../core/auth/auth.store'
import { ToastService } from '../../../../core/toast/toast.service'
import { Vehicle } from '../../models/vehicle.model'
import { CreateVehicleDto, UpdateVehicleDto } from '../../models/vehicle-dto.models'
import { formatKm, vehicleStatusLabel, vehicleStatusVariant } from '../../utils/vehicle.utils'
import { uniqueFieldValidator } from '../../validators/unique-field.validator'
import { HasUnsavedChanges } from '../../../../core/guards/unsaved-changes.guard'
import { BadgeComponent } from '../../../../shared/components/atoms/badge/badge.component'

interface VehicleForm {
  license_plate: FormControl<string>
  chassis: FormControl<string>
  renavam: FormControl<string>
  year: FormControl<number>
  brand_id: FormControl<string>
  model_id: FormControl<string>
}

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, BadgeComponent],
  template: `
    <div class="page narrow">

      <div class="page-header">
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <button
              type="button"
              class="btn ghost sm"
              style="gap:4px"
              (click)="goBack()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" style="width:12px;height:12px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
              </svg>
              Voltar
            </button>
            <h1 class="page-title">{{ pageTitle() }}</h1>
            @if (isEdit() && editVehicle()) {
              <app-badge
                [label]="vehicleStatusLabel(editVehicle()!.status)"
                [variant]="vehicleStatusVariant(editVehicle()!.status)"
                [dot]="true"
              />
            }
          </div>
          <p class="page-subtitle">{{ pageSubtitle() }}</p>
        </div>
      </div>

      @if (loading()) {
        <div class="card">
          <div class="form-section">
            <div class="form-grid">
              @for (i of skeletonRows; track i) {
                <div class="field">
                  <div class="skeleton" style="height:12px;width:80px;margin-bottom:2px"></div>
                  <div class="skeleton" style="height:32px;width:100%"></div>
                </div>
              }
            </div>
          </div>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="card">

          @if (!hasBrands()) {
            <div class="form-section">
              <div class="alert warning" style="gap:10px">
                <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px;flex-shrink:0;margin-top:1px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <div style="font-weight:600;margin-bottom:4px">Nenhuma marca cadastrada</div>
                  <div>Cadastre pelo menos uma marca e um modelo antes de registrar um veículo.</div>
                  <button type="button" class="btn primary sm" style="margin-top:8px" (click)="navigateToBrands()">
                    Ir para Catálogo
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- Dados regulatórios -->
          <div class="form-section">
            <h3>Dados regulatórios</h3>
            <p class="section-desc">Campos obrigatórios para vinculação ao DETRAN.</p>
            <div class="form-grid">

              <div class="field">
                <label class="field-label">Placa <span class="req">*</span></label>
                <input
                  type="text"
                  formControlName="license_plate"
                  class="input mono"
                  [class.has-error]="!!fieldError('license_plate')"
                  placeholder="ABC1A23"
                  maxlength="8"
                  style="text-transform:uppercase"
                />
                @if (isPending('license_plate')) {
                  <div class="field-help">Verificando disponibilidade…</div>
                } @else if (fieldError('license_plate')) {
                  <div class="field-error">{{ fieldError('license_plate') }}</div>
                }
              </div>

              <div class="field">
                <label class="field-label">
                  Ano <span class="req">*</span>
                  @if (isEdit()) { <span style="font-weight:400;color:var(--text-subtle)">(imutável)</span> }
                </label>
                <input
                  type="number"
                  formControlName="year"
                  class="input"
                  [class.has-error]="!!fieldError('year')"
                  [placeholder]="currentYear.toString()"
                  [min]="1950"
                  [max]="currentYear + 1"
                />
                @if (fieldError('year')) {
                  <div class="field-error">{{ fieldError('year') }}</div>
                }
              </div>

              <div class="field">
                <label class="field-label">
                  Chassi <span class="req">*</span>
                  @if (isEdit()) {
                    <span style="font-weight:400;color:var(--text-subtle)">(imutável)</span>
                  } @else {
                    <span style="font-weight:400;color:var(--text-subtle)">17 caracteres alfanuméricos</span>
                  }
                </label>
                <input
                  type="text"
                  formControlName="chassis"
                  class="input mono"
                  [class.has-error]="!!fieldError('chassis')"
                  placeholder="9BWZZZ377VT004251"
                  maxlength="17"
                  style="text-transform:uppercase"
                />
                @if (isPending('chassis')) {
                  <div class="field-help">Verificando disponibilidade…</div>
                } @else if (fieldError('chassis')) {
                  <div class="field-error">{{ fieldError('chassis') }}</div>
                }
              </div>

              <div class="field">
                <label class="field-label">
                  RENAVAM <span class="req">*</span>
                  @if (isEdit()) {
                    <span style="font-weight:400;color:var(--text-subtle)">(imutável)</span>
                  } @else {
                    <span style="font-weight:400;color:var(--text-subtle)">9–11 dígitos</span>
                  }
                </label>
                <input
                  type="text"
                  formControlName="renavam"
                  class="input mono"
                  [class.has-error]="!!fieldError('renavam')"
                  placeholder="01298374561"
                  maxlength="11"
                  inputmode="numeric"
                />
                @if (isPending('renavam')) {
                  <div class="field-help">Verificando disponibilidade…</div>
                } @else if (fieldError('renavam')) {
                  <div class="field-error">{{ fieldError('renavam') }}</div>
                }
              </div>

            </div>
          </div>

          <!-- Classificação -->
          <div class="form-section">
            <h3>Classificação</h3>
            <p class="section-desc">Marca → modelo (filtrado pela marca selecionada).</p>
            <div class="form-grid">

              <div class="field">
                <label class="field-label">Marca <span class="req">*</span></label>
                <div class="select-wrap">
                  <select
                    formControlName="brand_id"
                    class="select"
                    [class.has-error]="!!fieldError('brand_id')"
                  >
                    <option value="">Selecione uma marca</option>
                    @for (b of catalogStore.brands(); track b.id) {
                      <option [value]="b.id">{{ b.name }}</option>
                    }
                  </select>
                </div>
                @if (fieldError('brand_id')) {
                  <div class="field-error">{{ fieldError('brand_id') }}</div>
                }
              </div>

              <div class="field">
                <label class="field-label">Modelo <span class="req">*</span></label>
                <div class="select-wrap">
                  <select
                    formControlName="model_id"
                    class="select"
                    [class.has-error]="!!fieldError('model_id')"
                  >
                    <option value="">{{ !selectedBrandId() ? 'Selecione uma marca primeiro' : 'Selecione um modelo' }}</option>
                    @for (m of availableModels(); track m.id) {
                      <option [value]="m.id">{{ m.name }}</option>
                    }
                  </select>
                </div>
                @if (noModelsForBrand()) {
                  <div class="field-help" style="color:var(--warning-text)">
                    Nenhum modelo para esta marca.
                    <button type="button" style="text-decoration:underline;cursor:pointer" (click)="navigateToModels()">Cadastrar modelo</button>
                  </div>
                } @else if (fieldError('model_id')) {
                  <div class="field-error">{{ fieldError('model_id') }}</div>
                }
              </div>

            </div>
          </div>

          <!-- Metadados (somente edição) -->
          @if (isEdit() && editVehicle()) {
            <div class="form-section">
              <h3>Metadados</h3>
              <div class="form-grid">
                <div class="field">
                  <label class="field-label">Cadastrado em</label>
                  <input class="input" [value]="formatCreatedAt(editVehicle()!.created_at)" disabled />
                </div>
                <div class="field">
                  <label class="field-label">Cadastrado por</label>
                  <input class="input" [value]="editVehicle()!.created_by" disabled />
                </div>
                <div class="field">
                  <label class="field-label">Operações registradas</label>
                  <input class="input" [value]="editVehicle()!.operation_count ?? 0" disabled />
                </div>
                <div class="field">
                  <label class="field-label">Último odômetro</label>
                  <input class="input mono" [value]="formatKm(editVehicle()!.last_odometer_km)" disabled />
                </div>
              </div>
            </div>
          }

          <div class="form-actions">
            <button type="button" class="btn ghost" (click)="goBack()">Cancelar</button>
            <button
              type="submit"
              class="btn primary"
              [disabled]="saving() || noBrands() || (submitted() && !canSubmit())"
            >
              @if (saving()) { <span class="spinner" aria-hidden="true"></span> }
              {{ isEdit() ? 'Salvar alterações' : 'Cadastrar veículo' }}
            </button>
          </div>

        </form>
      }

    </div>
  `,
})
export class VehicleFormComponent implements OnInit, HasUnsavedChanges {
  protected readonly vehicleStore = inject(VehicleStore)
  protected readonly catalogStore = inject(CatalogStore)
  private readonly vehicleApi = inject(VehicleApiService)
  private readonly authStore = inject(AuthStore)
  private readonly toast = inject(ToastService)
  protected readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)
  private readonly injector = inject(Injector)

  readonly mode = input<'create' | 'edit'>('create')
  readonly vehicleId = input<string | undefined>(undefined)

  form!: FormGroup<VehicleForm>

  protected readonly saving = signal(false)
  protected readonly submitted = signal(false)
  protected readonly loading = signal(false)
  protected readonly editVehicle = signal<Vehicle | null>(null)
  protected readonly selectedBrandId = signal('')

  private readonly formValid = signal(false)
  private readonly formPending = signal(false)

  protected readonly isEdit = computed(() => this.mode() === 'edit')
  protected readonly pageTitle = computed(() =>
    this.isEdit() ? 'Editar Veículo' : 'Novo Veículo'
  )
  protected readonly pageSubtitle = computed(() =>
    this.isEdit()
      ? 'Chassi, RENAVAM e ano são campos regulatórios imutáveis.'
      : 'Preencha os dados regulatórios e classificação. O status inicial será Disponível.'
  )

  protected readonly canSubmit = computed(() =>
    this.formValid() && !this.formPending() && !this.saving()
  )

  protected readonly hasBrands  = computed(() => this.catalogStore.brands().length > 0)
  protected readonly noBrands   = computed(() => this.catalogStore.brands().length === 0)

  protected readonly availableModels = computed(() =>
    this.catalogStore.models().filter(m => m.brand_id === this.selectedBrandId())
  )

  protected readonly noModelsForBrand = computed(() =>
    !!this.selectedBrandId() && this.availableModels().length === 0
  )

  protected readonly currentYear = new Date().getFullYear()
  protected readonly skeletonRows = [1, 2, 3, 4, 5, 6]

  protected readonly vehicleStatusLabel   = vehicleStatusLabel
  protected readonly vehicleStatusVariant = vehicleStatusVariant
  protected readonly formatKm             = formatKm

  private readonly errorMessages: Readonly<Record<string, Record<string, string>>> = {
    license_plate: {
      required: 'Placa é obrigatória',
      pattern: 'Formato inválido. Ex: ABC-1234 ou ABC1D34',
      duplicate: 'Placa já cadastrada',
    },
    chassis: {
      required: 'Chassi é obrigatório',
      pattern: 'VIN inválido (17 caracteres, sem I/O/Q)',
      duplicate: 'Chassi já cadastrado',
    },
    renavam: {
      required: 'RENAVAM é obrigatório',
      pattern: 'RENAVAM inválido (9–11 dígitos)',
      duplicate: 'RENAVAM já cadastrado',
    },
    year: {
      required: 'Ano é obrigatório',
      min: 'Ano mínimo: 1950',
      max: `Ano máximo: ${new Date().getFullYear() + 1}`,
    },
    brand_id: { required: 'Marca é obrigatória' },
    model_id: { required: 'Modelo é obrigatório' },
  }

  ngOnInit(): void {
    this.catalogStore.loadIfEmpty()
    this.buildForm()
    this.setupPlateNormalization()
    this.setupChassisNormalization()
    this.setupBrandCascade()

    if (this.isEdit()) {
      toObservable(this.catalogStore.loaded, { injector: this.injector }).pipe(
        filter(Boolean),
        first()
      ).subscribe(() => this.initEditMode())
    }
  }

  hasUnsavedChanges(): boolean {
    return this.form?.dirty === true && !this.saving()
  }

  private buildForm(): void {
    const excludeId = this.vehicleId()

    this.form = new FormGroup<VehicleForm>({
      license_plate: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/^[A-Z]{3}-?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/),
        ],
        asyncValidators: [uniqueFieldValidator(this.vehicleApi, 'license_plate', excludeId)],
      }),
      chassis: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/^[A-HJ-NPR-Z0-9]{17}$/),
        ],
        asyncValidators: [uniqueFieldValidator(this.vehicleApi, 'chassis', excludeId)],
      }),
      renavam: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/^\d{9,11}$/),
        ],
        asyncValidators: [uniqueFieldValidator(this.vehicleApi, 'renavam', excludeId)],
      }),
      year: new FormControl<number>(this.currentYear, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(1950),
          Validators.max(this.currentYear + 1),
        ],
      }),
      brand_id: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      model_id: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    })

    this.form.statusChanges.pipe(
      startWith(this.form.status),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(status => {
      this.formValid.set(status === 'VALID')
      this.formPending.set(status === 'PENDING')
    })
  }

  private setupPlateNormalization(): void {
    const ctrl = this.form.controls.license_plate
    ctrl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => {
      if (!ctrl.dirty) return
      const normalized = v.toUpperCase()
      if (normalized !== v) {
        ctrl.setValue(normalized, { emitEvent: false })
      }
    })
  }

  private setupChassisNormalization(): void {
    const ctrl = this.form.controls.chassis
    ctrl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => {
      if (!ctrl.dirty) return
      const normalized = v.toUpperCase()
      if (normalized !== v) {
        ctrl.setValue(normalized, { emitEvent: false })
      }
    })
  }

  private setupBrandCascade(): void {
    this.form.controls.brand_id.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(brandId => {
      this.selectedBrandId.set(brandId)
      this.form.controls.model_id.setValue('', { emitEvent: false })
    })
  }

  private initEditMode(): void {
    const stored = this.vehicleStore.selectedVehicle()
    const id = this.vehicleId()

    if (stored && stored.id === id) {
      this.editVehicle.set(stored)
      this.populateForm(stored)
      return
    }

    if (!id) return

    this.loading.set(true)
    this.vehicleApi.getById(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: vehicle => {
        this.vehicleStore.setSelectedVehicle(vehicle)
        this.editVehicle.set(vehicle)
        this.populateForm(vehicle)
      },
      error: () => {
        this.toast.show('Veículo não encontrado', 'danger')
        this.router.navigate(['/vehicles'])
      },
    })
  }

  private populateForm(vehicle: Vehicle): void {
    const model = this.catalogStore.models().find(m => m.id === vehicle.model_id)
    const brandId = model?.brand_id ?? ''

    this.selectedBrandId.set(brandId)
    this.form.controls.brand_id.setValue(brandId, { emitEvent: false })

    this.form.patchValue({
      license_plate: vehicle.license_plate,
      year: vehicle.year,
      model_id: vehicle.model_id,
    }, { emitEvent: false })

    this.form.controls.chassis.setValue(vehicle.chassis, { emitEvent: false })
    this.form.controls.renavam.setValue(vehicle.renavam, { emitEvent: false })

    this.form.controls.chassis.disable()
    this.form.controls.renavam.disable()
    this.form.controls.year.disable()

    this.form.markAsPristine()
  }

  private buildUpdateDto(): UpdateVehicleDto {
    const raw = this.form.getRawValue()
    return {
      license_plate: raw.license_plate,
      brand_id: raw.brand_id,
      model_id: raw.model_id,
    }
  }

  onSubmit(): void {
    this.submitted.set(true)
    if (!this.canSubmit()) return
    this.saving.set(true)

    const user = this.authStore.user()!
    const save$ = this.mode() === 'create'
      ? this.vehicleStore.createVehicle({ ...this.form.getRawValue(), created_by: user.id } as CreateVehicleDto)
      : this.vehicleStore.updateVehicle(this.vehicleId()!, this.buildUpdateDto())

    save$.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.toast.show('Veículo salvo com sucesso', 'success')
        this.router.navigate(['/vehicles'])
      },
      error: () => {},
    })
  }

  goBack(): void {
    this.form?.markAsPristine()
    this.router.navigate(['/vehicles'])
  }

  navigateToBrands(): void {
    this.router.navigate(['/catalog/brands'])
  }

  navigateToModels(): void {
    this.router.navigate(['/catalog/models'])
  }

  protected fieldError(field: string): string | null {
    const ctrl = this.form?.get(field)
    if (!ctrl || !ctrl.invalid) return null
    if (!ctrl.touched && !this.submitted()) return null
    const msgs = this.errorMessages[field]
    for (const key of Object.keys(ctrl.errors ?? {})) {
      if (msgs?.[key]) return msgs[key]
    }
    return null
  }

  protected isPending(field: 'license_plate' | 'chassis' | 'renavam'): boolean {
    return this.form?.get(field)?.status === 'PENDING'
  }

  protected formatCreatedAt(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }
}

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
import { vehicleStatusLabel, vehicleStatusVariant } from '../../utils/vehicle.utils'
import { uniqueFieldValidator } from '../../validators/unique-field.validator'
import { HasUnsavedChanges } from '../../../../core/guards/unsaved-changes.guard'
import { InputFieldComponent } from '../../../../shared/components/atoms/input-field/input-field.component'
import { SelectFieldComponent } from '../../../../shared/components/atoms/select-field/select-field.component'
import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component'
import { BadgeComponent } from '../../../../shared/components/atoms/badge/badge.component'
import { SelectOption } from '../../../../shared/components/atoms/select-field/select-option.model'

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
  imports: [
    ReactiveFormsModule,
    InputFieldComponent,
    SelectFieldComponent,
    ButtonComponent,
    BadgeComponent,
  ],
  template: `
    <div class="flex flex-col h-full">

      <div class="flex items-center gap-3 px-6 py-5 border-b border-border">
        <button
          type="button"
          (click)="goBack()"
          class="inline-flex h-[30px] items-center gap-1 px-2 text-[12.5px] text-muted hover:text-text transition-colors rounded-[5px] hover:bg-surface-elevated cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          Voltar
        </button>
        <div class="h-4 w-px bg-border"></div>
        <div class="flex items-center gap-2">
          <h1 class="text-[17px] font-semibold text-text">{{ pageTitle() }}</h1>
          @if (isEdit() && editVehicle()) {
            <app-badge
              [label]="vehicleStatusLabel(editVehicle()!.status)"
              [variant]="vehicleStatusVariant(editVehicle()!.status)"
              [dot]="true"
            />
          }
        </div>
      </div>

      <div class="flex-1 overflow-auto px-6 py-6">

        @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            @for (i of skeletonRows; track i) {
              <div class="flex flex-col gap-1">
                <div class="h-[13px] w-20 animate-pulse rounded bg-surface-elevated"></div>
                <div class="h-[32px] w-full animate-pulse rounded-[5px] bg-surface-elevated"></div>
              </div>
            }
          </div>
        } @else if (!hasBrands()) {
          <div class="flex flex-col items-center justify-center py-16 gap-3 text-center max-w-sm mx-auto">
            <p class="text-[14px] text-muted">
              Nenhuma marca cadastrada. Adicione marcas antes de cadastrar veículos.
            </p>
            <app-button (clicked)="navigateToBrands()">Ir para Catálogo de Marcas</app-button>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="max-w-2xl">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

              <app-input-field
                label="Placa"
                placeholder="ABC-1234"
                formControlName="license_plate"
                [error]="fieldError('license_plate')"
                [required]="true"
                [pending]="isPending('license_plate')"
              />

              <app-input-field
                label="Ano"
                type="number"
                placeholder="{{ currentYear }}"
                formControlName="year"
                [error]="fieldError('year')"
                [required]="true"
              />

              <app-input-field
                label="Chassi"
                placeholder="9BWZZZ377VT004251"
                formControlName="chassis"
                [error]="fieldError('chassis')"
                [required]="true"
                [pending]="isPending('chassis')"
              />

              <app-input-field
                label="RENAVAM"
                placeholder="00123456789"
                formControlName="renavam"
                [error]="fieldError('renavam')"
                [required]="true"
                [pending]="isPending('renavam')"
              />

              <app-select-field
                label="Marca"
                placeholder="Selecione a marca..."
                formControlName="brand_id"
                [options]="brandOptions()"
                [error]="fieldError('brand_id')"
                [required]="true"
              />

              <div class="flex flex-col gap-1">
                <app-select-field
                  label="Modelo"
                  placeholder="Selecione o modelo..."
                  formControlName="model_id"
                  [options]="modelOptions()"
                  [error]="fieldError('model_id')"
                  [required]="true"
                />
                @if (noModelsForBrand()) {
                  <p class="text-[11.5px] text-warning-text mt-0.5">
                    Nenhum modelo cadastrado para esta marca.
                    <button type="button" (click)="navigateToModels()" class="underline cursor-pointer">Cadastrar modelo</button>
                  </p>
                }
              </div>

            </div>

            <div class="flex items-center gap-3 mt-6 pt-4 border-t border-border">
              <app-button
                type="submit"
                variant="primary"
                [loading]="saving()"
                [disabled]="submitted() && !canSubmit()"
              >
                {{ isEdit() ? 'Salvar alterações' : 'Cadastrar veículo' }}
              </app-button>
              <app-button type="button" (clicked)="goBack()">Cancelar</app-button>
            </div>

          </form>
        }

      </div>
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
  protected readonly pageTitle = computed(() => this.isEdit() ? 'Editar Veículo' : 'Novo Veículo')

  protected readonly canSubmit = computed(() =>
    this.formValid() && !this.formPending() && !this.saving()
  )

  protected readonly hasBrands = computed(() => this.catalogStore.brands().length > 0)

  protected readonly availableModels = computed(() =>
    this.catalogStore.models().filter(m => m.brand_id === this.selectedBrandId())
  )

  protected readonly noModelsForBrand = computed(() =>
    !!this.selectedBrandId() && this.availableModels().length === 0
  )

  protected readonly brandOptions = computed<SelectOption[]>(() =>
    this.catalogStore.brands().map(b => ({ value: b.id, label: b.name }))
  )

  protected readonly modelOptions = computed<SelectOption[]>(() =>
    this.availableModels().map(m => ({ value: m.id, label: m.name }))
  )

  protected readonly currentYear = new Date().getFullYear()
  protected readonly skeletonRows = [1, 2, 3, 4, 5, 6]

  protected readonly vehicleStatusLabel = vehicleStatusLabel
  protected readonly vehicleStatusVariant = vehicleStatusVariant

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
}

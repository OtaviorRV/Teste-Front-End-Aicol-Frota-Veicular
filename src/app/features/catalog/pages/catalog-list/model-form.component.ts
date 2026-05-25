import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms'
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog'
import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component'
import { InputFieldComponent } from '../../../../shared/components/atoms/input-field/input-field.component'
import { SelectFieldComponent } from '../../../../shared/components/atoms/select-field/select-field.component'
import { AuthStore } from '../../../../core/auth/auth.store'
import { ModelApiService } from '../../services/model-api.service'
import { CatalogStore } from '../../store/catalog.store'
import { VehicleModel, CreateModelDto, UpdateModelDto } from '../../models/catalog.models'
import { uniqueModelNameValidator } from '../../validators/catalog.validators'
import { SelectOption } from '../../../../shared/components/atoms/select-field/select-option.model'

export interface ModelFormData {
  model?: VehicleModel
  mode: 'create' | 'edit'
}

interface ModelForm {
  name: FormControl<string>
  brand_id: FormControl<string>
}

@Component({
  selector: 'app-model-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent, InputFieldComponent, SelectFieldComponent],
  template: `
    <div class="dialog">

      <div class="dialog-header" style="display: flex; align-items: center; justify-content: space-between">
        <h2 class="dialog-title">{{ data.mode === 'edit' ? 'Editar Modelo' : 'Novo Modelo' }}</h2>
        <button type="button" class="btn icon" (click)="close()" aria-label="Fechar">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="dialog-body" style="display: flex; flex-direction: column; gap: 14px">
          <app-select-field
            label="Marca"
            placeholder="Selecione uma marca"
            formControlName="brand_id"
            [options]="brandOptions()"
            [required]="true"
            [error]="brandError()"
          />
          <app-input-field
            label="Nome"
            placeholder="Ex.: Corolla"
            formControlName="name"
            [required]="true"
            [error]="nameError()"
          />
        </div>
        <div class="dialog-footer">
          <app-button variant="ghost" type="button" (clicked)="close()">Cancelar</app-button>
          <app-button
            variant="primary"
            type="submit"
            [disabled]="!canSubmit()"
            [loading]="saving()"
          >Salvar</app-button>
        </div>
      </form>

    </div>
  `,
})
export class ModelFormComponent implements OnInit {
  protected readonly data = inject<ModelFormData>(DIALOG_DATA)
  private readonly dialogRef = inject<DialogRef<'saved' | undefined>>(DialogRef)
  private readonly modelApi = inject(ModelApiService)
  private readonly catalogStore = inject(CatalogStore)
  private readonly authStore = inject(AuthStore)
  private readonly destroyRef = inject(DestroyRef)

  protected readonly selectedBrandId = signal<string>('')

  protected readonly brandOptions = computed<SelectOption[]>(() =>
    this.catalogStore.brands().map(b => ({ value: b.id, label: b.name }))
  )

  protected form!: FormGroup<ModelForm>
  protected readonly saving = signal(false)
  protected readonly formValid = signal(false)
  protected readonly formPending = signal(false)

  protected readonly canSubmit = computed(
    () => this.formValid() && !this.formPending() && !this.saving()
  )

  protected readonly nameError = computed((): string | null => {
    const ctrl = this.form?.controls.name
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null
    if (ctrl.errors?.['required'])   return 'Nome é obrigatório.'
    if (ctrl.errors?.['minlength'])  return 'Mínimo 2 caracteres.'
    if (ctrl.errors?.['maxlength'])  return 'Máximo 100 caracteres.'
    if (ctrl.errors?.['fieldTaken']) return 'Já existe um modelo com esse nome para esta marca.'
    return null
  })

  protected readonly brandError = computed((): string | null => {
    const ctrl = this.form?.controls.brand_id
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null
    return 'Marca é obrigatória.'
  })

  ngOnInit(): void {
    this.form = new FormGroup<ModelForm>({
      name: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
        asyncValidators: [
          uniqueModelNameValidator(this.modelApi, this.selectedBrandId, this.data.model?.id),
        ],
      }),
      brand_id: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    })

    this.form.controls.brand_id.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(brandId => {
      this.selectedBrandId.set(brandId)
      this.form.controls.name.updateValueAndValidity()
    })

    this.form.statusChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(status => {
      this.formValid.set(status === 'VALID')
      this.formPending.set(status === 'PENDING')
    })
    this.formValid.set(this.form.status === 'VALID')
    this.formPending.set(this.form.status === 'PENDING')

    if (this.data.mode === 'edit' && this.data.model) {
      this.selectedBrandId.set(this.data.model.brand_id)
      this.form.patchValue({
        name: this.data.model.name,
        brand_id: this.data.model.brand_id,
      })
      this.form.controls.brand_id.disable()
      this.form.markAsPristine()
    }
  }

  protected submit(): void {
    this.form.markAllAsTouched()
    if (!this.canSubmit() || this.form.invalid) return
    this.saving.set(true)

    const userId = this.authStore.user()?.id ?? ''
    const brandId = this.form.controls.brand_id.value || this.data.model!.brand_id

    const obs = this.data.mode === 'create'
      ? this.catalogStore.createModel({ name: this.form.controls.name.value, brand_id: brandId, created_by: userId } as CreateModelDto)
      : this.catalogStore.updateModel(this.data.model!.id, { name: this.form.controls.name.value } as UpdateModelDto)

    obs.subscribe({
      next: () => {
        this.saving.set(false)
        this.dialogRef.close('saved')
      },
      error: () => this.saving.set(false),
    })
  }

  protected close(): void {
    this.dialogRef.close()
  }
}

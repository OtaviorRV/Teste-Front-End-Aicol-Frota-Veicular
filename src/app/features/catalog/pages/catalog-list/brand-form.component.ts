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
import { AuthStore } from '../../../../core/auth/auth.store'
import { BrandApiService } from '../../services/brand-api.service'
import { CatalogStore } from '../../store/catalog.store'
import { Brand, CreateBrandDto, UpdateBrandDto } from '../../models/catalog.models'
import { uniqueBrandNameValidator } from '../../validators/catalog.validators'

export interface BrandFormData {
  brand?: Brand
  mode: 'create' | 'edit'
}

interface BrandForm {
  name: FormControl<string>
}

@Component({
  selector: 'app-brand-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent, InputFieldComponent],
  template: `
    <div class="dialog">

      <div class="dialog-header" style="display: flex; align-items: center; justify-content: space-between">
        <h2 class="dialog-title">{{ data.mode === 'edit' ? 'Editar Marca' : 'Nova Marca' }}</h2>
        <button type="button" class="btn icon" (click)="close()" aria-label="Fechar">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="dialog-body">
          <app-input-field
            label="Nome"
            placeholder="Ex.: Toyota"
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
export class BrandFormComponent implements OnInit {
  protected readonly data = inject<BrandFormData>(DIALOG_DATA)
  private readonly dialogRef = inject<DialogRef<'saved' | undefined>>(DialogRef)
  private readonly brandApi = inject(BrandApiService)
  private readonly catalogStore = inject(CatalogStore)
  private readonly authStore = inject(AuthStore)
  private readonly destroyRef = inject(DestroyRef)

  protected form!: FormGroup<BrandForm>
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
    if (ctrl.errors?.['fieldTaken']) return 'Já existe uma marca com esse nome.'
    return null
  })

  ngOnInit(): void {
    this.form = new FormGroup<BrandForm>({
      name: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
        asyncValidators: [uniqueBrandNameValidator(this.brandApi, this.data.brand?.id)],
      }),
    })

    this.form.statusChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(status => {
      this.formValid.set(status === 'VALID')
      this.formPending.set(status === 'PENDING')
    })
    this.formValid.set(this.form.status === 'VALID')
    this.formPending.set(this.form.status === 'PENDING')

    if (this.data.mode === 'edit' && this.data.brand) {
      this.form.patchValue({ name: this.data.brand.name })
      this.form.markAsPristine()
    }
  }

  protected submit(): void {
    this.form.markAllAsTouched()
    if (!this.canSubmit() || this.form.invalid) return
    this.saving.set(true)

    const userId = this.authStore.user()?.id ?? ''
    const obs = this.data.mode === 'create'
      ? this.catalogStore.createBrand({ name: this.form.controls.name.value, created_by: userId } as CreateBrandDto)
      : this.catalogStore.updateBrand(this.data.brand!.id, { name: this.form.controls.name.value } as UpdateBrandDto)

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

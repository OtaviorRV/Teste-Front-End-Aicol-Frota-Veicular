import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core'
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms'
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog'
import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component'
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
  imports: [ReactiveFormsModule, ButtonComponent],
  template: `
    <div class="flex flex-col gap-5 p-6 w-[480px]">
      <div class="flex items-center justify-between">
        <h2 class="text-[15px] font-semibold text-text">
          {{ data.mode === 'edit' ? 'Editar Marca' : 'Nova Marca' }}
        </h2>
        <button
          type="button"
          (click)="close()"
          class="text-muted hover:text-text transition-colors"
          aria-label="Fechar"
        >✕</button>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-[12.5px] font-medium text-text">Nome</label>
          <input
            formControlName="name"
            type="text"
            placeholder="Ex.: Toyota"
            class="h-9 rounded-[5px] border border-border-strong bg-surface-raised px-3 text-[13px] text-text placeholder:text-muted outline-none focus-visible:border-border-focus focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] transition-[border-color,box-shadow] duration-[80ms]"
            [class.border-danger]="nameInvalid()"
          />
          @if (nameInvalid()) {
            <p class="text-[11.5px] text-danger-text">
              @if (form.controls.name.errors?.['required']) { Nome é obrigatório. }
              @else if (form.controls.name.errors?.['minlength']) { Mínimo 2 caracteres. }
              @else if (form.controls.name.errors?.['maxlength']) { Máximo 100 caracteres. }
              @else if (form.controls.name.errors?.['fieldTaken']) { Já existe uma marca com esse nome. }
            </p>
          }
        </div>

        <div class="flex justify-end gap-2 pt-1">
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

  protected form!: FormGroup<BrandForm>
  protected readonly saving = signal(false)
  protected readonly formValid = signal(false)
  protected readonly formPending = signal(false)

  protected readonly canSubmit = computed(
    () => this.formValid() && !this.formPending() && !this.saving()
  )

  protected readonly nameInvalid = computed(
    () => this.form?.controls.name.invalid && this.form.controls.name.touched
  )

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

    this.form.statusChanges.subscribe(status => {
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
    if (!this.canSubmit() || this.form.invalid) return
    this.saving.set(true)

    const obs = this.data.mode === 'create'
      ? this.catalogStore.createBrand({ name: this.form.controls.name.value, created_by: 'admin' } as CreateBrandDto)
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

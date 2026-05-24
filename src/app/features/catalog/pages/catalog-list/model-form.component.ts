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
import { ModelApiService } from '../../services/model-api.service'
import { CatalogStore } from '../../store/catalog.store'
import { VehicleModel, CreateModelDto, UpdateModelDto } from '../../models/catalog.models'
import { uniqueModelNameValidator } from '../../validators/catalog.validators'

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
  imports: [ReactiveFormsModule, ButtonComponent],
  template: `
    <div class="flex flex-col gap-5 p-6 w-[480px]">
      <div class="flex items-center justify-between">
        <h2 class="text-[15px] font-semibold text-text">
          {{ data.mode === 'edit' ? 'Editar Modelo' : 'Novo Modelo' }}
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
          <label class="text-[12.5px] font-medium text-text">Marca</label>
          <select
            formControlName="brand_id"
            class="h-9 rounded-[5px] border border-border-strong bg-surface-raised px-3 text-[13px] text-text outline-none focus-visible:border-border-focus disabled:opacity-50 disabled:cursor-not-allowed"
            [class.border-danger]="brandInvalid()"
            (change)="onBrandChange($any($event.target).value)"
          >
            <option value="">Selecione uma marca</option>
            @for (brand of brands(); track brand.id) {
              <option [value]="brand.id">{{ brand.name }}</option>
            }
          </select>
          @if (brandInvalid()) {
            <p class="text-[11.5px] text-danger-text">Marca é obrigatória.</p>
          }
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-[12.5px] font-medium text-text">Nome</label>
          <input
            formControlName="name"
            type="text"
            placeholder="Ex.: Corolla"
            class="h-9 rounded-[5px] border border-border-strong bg-surface-raised px-3 text-[13px] text-text placeholder:text-muted outline-none focus-visible:border-border-focus focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] transition-[border-color,box-shadow] duration-[80ms]"
            [class.border-danger]="nameInvalid()"
          />
          @if (nameInvalid()) {
            <p class="text-[11.5px] text-danger-text">
              @if (form.controls.name.errors?.['required']) { Nome é obrigatório. }
              @else if (form.controls.name.errors?.['minlength']) { Mínimo 2 caracteres. }
              @else if (form.controls.name.errors?.['maxlength']) { Máximo 100 caracteres. }
              @else if (form.controls.name.errors?.['fieldTaken']) { Já existe um modelo com esse nome para esta marca. }
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
export class ModelFormComponent implements OnInit {
  protected readonly data = inject<ModelFormData>(DIALOG_DATA)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly dialogRef = inject<DialogRef<any>>(DialogRef)
  private readonly modelApi = inject(ModelApiService)
  private readonly catalogStore = inject(CatalogStore)

  protected readonly brands = this.catalogStore.brands
  protected readonly selectedBrandId = signal<string>('')

  protected form!: FormGroup<ModelForm>
  protected readonly saving = signal(false)
  protected readonly formValid = signal(false)
  protected readonly formPending = signal(false)

  protected readonly canSubmit = computed(
    () => this.formValid() && !this.formPending() && !this.saving()
  )
  protected readonly nameInvalid = computed(
    () => this.form?.controls.name.invalid && this.form.controls.name.touched
  )
  protected readonly brandInvalid = computed(
    () => this.form?.controls.brand_id.invalid && this.form.controls.brand_id.touched
  )

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

    this.form.statusChanges.subscribe(status => {
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

  protected onBrandChange(brandId: string): void {
    this.selectedBrandId.set(brandId)
    this.form.controls.name.updateValueAndValidity()
  }

  protected submit(): void {
    if (!this.canSubmit() || this.form.invalid) return
    this.saving.set(true)

    const name = this.form.controls.name.value
    const brandId = this.form.controls.brand_id.value || this.data.model!.brand_id

    const obs = this.data.mode === 'create'
      ? this.catalogStore.createModel({ name, brand_id: brandId, created_by: 'admin' } as CreateModelDto)
      : this.catalogStore.updateModel(this.data.model!.id, { name } as UpdateModelDto)

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

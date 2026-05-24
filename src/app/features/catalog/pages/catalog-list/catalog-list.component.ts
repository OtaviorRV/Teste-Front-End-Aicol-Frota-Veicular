import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { finalize } from 'rxjs/operators'
import { take } from 'rxjs/operators'

import { CatalogStore } from '../../store/catalog.store'
import { Brand, VehicleModel } from '../../models/catalog.models'
import { VehicleApiService } from '../../../vehicles/services/vehicle-api.service'
import { DialogService } from '../../../../core/dialog/dialog.service'
import { ToastService } from '../../../../core/toast/toast.service'
import { canDeleteBrand, canDeleteModel } from '../../utils/catalog.utils'
import { DataTableComponent } from '../../../../shared/components/molecules/data-table/data-table.component'
import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component'
import { TableColumn } from '../../../../shared/components/molecules/data-table/table-column.model'
import { BrandFormComponent, BrandFormData } from './brand-form.component'
import { ModelFormComponent, ModelFormData } from './model-form.component'

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, ButtonComponent],
  template: `
    <div class="flex flex-col h-full">

      <div class="flex items-center justify-between px-6 py-5 border-b border-border">
        <div>
          <h1 class="text-[17px] font-semibold text-text">
            {{ entity() === 'brands' ? 'Marcas' : 'Modelos' }}
          </h1>
          <p class="text-[12.5px] text-muted mt-0.5">
            {{ entity() === 'brands'
              ? catalogStore.brands().length + ' marcas cadastradas'
              : catalogStore.models().length + ' modelos cadastrados' }}
          </p>
        </div>
        <app-button variant="primary" (clicked)="openForm()">
          + {{ entity() === 'brands' ? 'Nova Marca' : 'Novo Modelo' }}
        </app-button>
      </div>

      @if (entity() === 'brands') {
        <app-data-table
          [rows]="catalogStore.brands()"
          [columns]="brandColumns()"
          [loading]="catalogStore.loading()"
        />
      } @else {
        <app-data-table
          [rows]="catalogStore.models()"
          [columns]="modelColumns()"
          [loading]="catalogStore.loading()"
        />
      }

    </div>

    <!-- Brand actions template -->
    <ng-template #brandActionsTemplate let-row>
      <div class="flex items-center justify-end gap-1">
        <app-button variant="ghost" size="sm" (clicked)="openBrandForm(row)">Editar</app-button>
        <app-button
          variant="ghost"
          size="sm"
          [disabled]="catalogLoading()"
          (clicked)="deleteBrand(row)"
        >Excluir</app-button>
      </div>
    </ng-template>

    <!-- Model actions template -->
    <ng-template #modelActionsTemplate let-row>
      <div class="flex items-center justify-end gap-1">
        <app-button variant="ghost" size="sm" (clicked)="openModelForm(row)">Editar</app-button>
        <app-button
          variant="ghost"
          size="sm"
          [disabled]="catalogLoading() || deletingId() === row.id"
          [loading]="deletingId() === row.id"
          (clicked)="deleteModel(row)"
        >Excluir</app-button>
      </div>
    </ng-template>
  `,
})
export class CatalogListComponent implements OnInit, AfterViewInit {
  readonly entity = input<'brands' | 'models'>('brands')

  protected readonly catalogStore = inject(CatalogStore)
  private readonly vehicleApi = inject(VehicleApiService)
  private readonly dialogService = inject(DialogService)
  private readonly toast = inject(ToastService)
  private readonly destroyRef = inject(DestroyRef)

  @ViewChild('brandActionsTemplate', { static: true })
  private brandActionsRef!: TemplateRef<{ $implicit: Brand }>

  @ViewChild('modelActionsTemplate', { static: true })
  private modelActionsRef!: TemplateRef<{ $implicit: VehicleModel }>

  protected readonly deletingId = signal<string | null>(null)

  protected readonly catalogLoading = computed(
    () => this.catalogStore.loading() || !this.catalogStore.loaded()
  )

  protected readonly brandColumns = signal<TableColumn<Brand>[]>([])
  protected readonly modelColumns = signal<TableColumn<VehicleModel>[]>([])

  ngOnInit(): void {
    this.catalogStore.loadIfEmpty()
  }

  ngAfterViewInit(): void {
    this.brandColumns.set([
      { key: 'name', label: 'Nome' },
      { key: 'created_by', label: 'Criado por', width: '150px' },
      { key: 'created_at', label: 'Criado em', width: '160px', render: r => new Date(r.created_at).toLocaleDateString('pt-BR') },
      { key: 'actions', label: '', width: '120px', action: true, cellTemplate: this.brandActionsRef },
    ])
    this.modelColumns.set([
      { key: 'name', label: 'Modelo' },
      {
        key: 'brand_id',
        label: 'Marca',
        width: '160px',
        render: r => this.catalogStore.brands().find(b => b.id === r.brand_id)?.name ?? r.brand_id,
      },
      { key: 'created_by', label: 'Criado por', width: '150px' },
      { key: 'created_at', label: 'Criado em', width: '160px', render: r => new Date(r.created_at).toLocaleDateString('pt-BR') },
      { key: 'actions', label: '', width: '120px', action: true, cellTemplate: this.modelActionsRef },
    ])
  }

  protected openForm(): void {
    if (this.entity() === 'brands') {
      this.openBrandForm()
    } else {
      this.openModelForm()
    }
  }

  protected openBrandForm(brand?: Brand): void {
    this.dialogService
      .open<'saved' | undefined, BrandFormData>(BrandFormComponent, {
        data: { brand, mode: brand ? 'edit' : 'create' },
      })
      .closed.pipe(take(1))
      .subscribe(result => {
        if (result === 'saved') {
          this.toast.show('Marca salva com sucesso', 'success')
        }
      })
  }

  protected openModelForm(model?: VehicleModel): void {
    this.dialogService
      .open<'saved' | undefined, ModelFormData>(ModelFormComponent, {
        data: { model, mode: model ? 'edit' : 'create' },
      })
      .closed.pipe(take(1))
      .subscribe(result => {
        if (result === 'saved') {
          this.toast.show('Modelo salvo com sucesso', 'success')
        }
      })
  }

  protected deleteBrand(brand: Brand): void {
    const modelCount = this.catalogStore.modelCountByBrand().get(brand.id) ?? 0
    const guard = canDeleteBrand(brand, modelCount)
    if (!guard.allowed) {
      this.toast.show(guard.reason!, 'warning')
      return
    }
    this.dialogService
      .confirm({
        title: 'Excluir marca',
        message: `Tem certeza que deseja excluir "${brand.name}"? Esta ação não pode ser desfeita.`,
        variant: 'danger',
        confirmLabel: 'Excluir',
      })
      .pipe(take(1))
      .subscribe(confirmed => {
        if (!confirmed) return
        this.catalogStore.deleteBrand(brand.id).subscribe(() =>
          this.toast.show('Marca excluída com sucesso', 'success')
        )
      })
  }

  protected deleteModel(model: VehicleModel): void {
    this.deletingId.set(model.id)
    this.vehicleApi
      .countByModel(model.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.deletingId.set(null))
      )
      .subscribe(count => {
        const guard = canDeleteModel(model, count)
        if (!guard.allowed) {
          this.toast.show(guard.reason!, 'warning')
          return
        }
        this.dialogService
          .confirm({
            title: 'Excluir modelo',
            message: `Tem certeza que deseja excluir "${model.name}"? Esta ação não pode ser desfeita.`,
            variant: 'danger',
            confirmLabel: 'Excluir',
          })
          .pipe(take(1))
          .subscribe(confirmed => {
            if (!confirmed) return
            this.catalogStore.deleteModel(model.id).subscribe(() =>
              this.toast.show('Modelo excluído com sucesso', 'success')
            )
          })
      })
  }
}

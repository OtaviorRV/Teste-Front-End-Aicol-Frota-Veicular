import { Routes } from '@angular/router'
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard'

export const vehiclesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/vehicle-list/vehicle-list.component').then(m => m.VehicleListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/vehicle-form/vehicle-form.component').then(m => m.VehicleFormComponent),
    data: { mode: 'create' },
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':vehicleId/edit',
    loadComponent: () =>
      import('./pages/vehicle-form/vehicle-form.component').then(m => m.VehicleFormComponent),
    data: { mode: 'edit' },
    canDeactivate: [unsavedChangesGuard],
  },
]

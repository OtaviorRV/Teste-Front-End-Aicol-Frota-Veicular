import { Routes } from '@angular/router'

export const vehiclesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/vehicle-list/vehicle-list.component').then(m => m.VehicleListComponent),
  },
]

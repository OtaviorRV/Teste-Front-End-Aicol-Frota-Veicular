import { Routes } from '@angular/router'

export const catalogRoutes: Routes = [
  { path: '', redirectTo: 'brands', pathMatch: 'full' },
  {
    path: 'brands',
    loadComponent: () =>
      import('./pages/catalog-list/catalog-list.component').then(m => m.CatalogListComponent),
    data: { entity: 'brands' },
  },
  {
    path: 'models',
    loadComponent: () =>
      import('./pages/catalog-list/catalog-list.component').then(m => m.CatalogListComponent),
    data: { entity: 'models' },
  },
]

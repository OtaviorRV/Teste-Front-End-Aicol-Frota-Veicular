import { Routes } from '@angular/router'
import { authGuard, redirectIfAuthenticatedGuard } from './core/auth/auth.guard'

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [redirectIfAuthenticatedGuard],
    loadComponent: () =>
      import('./shared/layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent),
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/dashboard-shell/dashboard-shell.component').then(m => m.DashboardShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'vehicles', pathMatch: 'full' },
      {
        path: 'vehicles',
        loadChildren: () =>
          import('./features/vehicles/vehicles.routes').then(m => m.vehiclesRoutes),
      },
      {
        path: 'catalog',
        loadChildren: () =>
          import('./features/catalog/catalog.routes').then(m => m.catalogRoutes),
      },
      {
        path: 'history',
        loadChildren: () =>
          import('./features/history/history.routes').then(m => m.historyRoutes),
      },
      {
        path: 'audit',
        loadChildren: () =>
          import('./features/audit/audit.routes').then(m => m.auditRoutes),
      },
    ],
  },
  { path: '**', redirectTo: 'vehicles' },
]

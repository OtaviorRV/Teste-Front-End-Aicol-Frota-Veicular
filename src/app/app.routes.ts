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
  { path: '**', redirectTo: 'login' },
]

import { Routes } from '@angular/router'

export const historyRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/history-list/history-list.component').then(
        m => m.HistoryListComponent
      ),
  },
]

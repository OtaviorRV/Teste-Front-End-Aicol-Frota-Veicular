import { Routes } from '@angular/router'
import { AuditStore } from './store/audit.store'

export const auditRoutes: Routes = [
  {
    path: '',
    providers: [AuditStore],
    loadComponent: () =>
      import('./pages/audit-log/audit-log.component').then(m => m.AuditLogComponent),
  },
]

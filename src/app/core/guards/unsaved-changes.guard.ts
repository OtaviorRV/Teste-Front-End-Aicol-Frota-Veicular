import { inject } from '@angular/core'
import { CanDeactivateFn } from '@angular/router'
import { DialogService } from '../dialog/dialog.service'

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component.hasUnsavedChanges()) return true
  return inject(DialogService).confirm({
    title: 'Alterações não salvas',
    message: 'Há alterações não salvas. Deseja sair mesmo assim?',
    confirmLabel: 'Sair',
    cancelLabel: 'Continuar editando',
    variant: 'danger',
  })
}

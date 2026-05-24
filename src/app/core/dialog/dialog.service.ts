import { Injectable, inject } from '@angular/core'
import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog'
import { ComponentType } from '@angular/cdk/portal'
import { Observable, map } from 'rxjs'
import { ConfirmDialogComponent } from '../../shared/components/molecules/confirm-dialog/confirm-dialog.component'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog)

  open<R = unknown, D = unknown>(
    component: ComponentType<unknown>,
    config?: DialogConfig<D>
  ): DialogRef<R> {
    return this.dialog.open<R, D>(component, {
      width: '480px',
      disableClose: false,
      backdropClass: 'dlg-backdrop',
      panelClass: 'dlg-panel',
      ...config,
    } as DialogConfig<D, DialogRef<R>>)
  }

  confirm(options: ConfirmOptions): Observable<boolean> {
    const ref = this.dialog.open<'confirmed' | 'cancelled', ConfirmOptions>(
      ConfirmDialogComponent,
      {
        data: options,
        width: '420px',
        disableClose: false,
        backdropClass: 'dlg-backdrop',
        panelClass: 'dlg-panel',
      }
    )
    return ref.closed.pipe(map(r => r === 'confirmed'))
  }
}

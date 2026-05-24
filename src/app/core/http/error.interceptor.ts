import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { AuthStore } from '../auth/auth.store'
import { ToastService } from '../toast/toast.service'

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService)
  const authStore = inject(AuthStore)
  const router = inject(Router)

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          if (!req.url.includes('/auth/login')) {
            toast.show('Sessão expirada. Faça login novamente.', 'warning')
            authStore.logout()
          }
          break

        case 404:
          toast.show('Registro não encontrado. Pode ter sido removido.', 'warning')
          if (req.method !== 'GET') {
            router.navigate([getListRouteForUrl(req.url)])
          }
          break

        case 409:
          toast.show('Conflito: registro atualizado por outro operador. Recarregando...', 'warning')
          break

        case 422:
          toast.show('Dados recusados pelo servidor. Verifique as informações e tente novamente.', 'danger')
          break

        default:
          toast.show('Erro inesperado. Tente novamente.', 'danger')
      }
      return throwError(() => error)
    })
  )
}

function getListRouteForUrl(url: string): string {
  const path = new URL(url, 'http://x').pathname
  if (path.includes('/vehicles'))   return '/vehicles'
  if (path.includes('/brands'))     return '/catalog/brands'
  if (path.includes('/models'))     return '/catalog/models'
  if (path.includes('/operations')) return '/history'
  return '/'
}

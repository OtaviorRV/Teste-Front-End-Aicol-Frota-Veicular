import { Signal } from '@angular/core'
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms'
import { catchError, map, Observable, of, switchMap, timer } from 'rxjs'
import { ModelApiService } from '../services/model-api.service'

export function uniqueModelNameValidator(
  modelApi: ModelApiService,
  brandId: Signal<string>,
  excludeId?: string
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const brand = brandId()
    if (!brand || !control.value?.trim()) return of(null)
    return timer(400).pipe(
      switchMap(() => modelApi.checkNameExists(control.value, brand, excludeId)),
      map(exists => (exists ? { fieldTaken: true } : null)),
      catchError(() => of(null))
    )
  }
}
